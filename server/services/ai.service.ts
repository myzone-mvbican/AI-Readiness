import OpenAI from "openai";
import { UserService } from "./user.service";
import { SurveyService } from "./survey.service";
import { getCategoryScores } from "@/lib/utils";
import { Assessment } from "@shared/types";
import { PDFGenerator } from "../utils/pdf-generator";
import { render } from "@react-email/render";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { assessments } from "@shared/schema";
import { EmailService } from "./email.service";
import AssessmentCompleteEmail from "../emails/assessment-complete";
import { ValidationError, InternalServerError } from "../utils/errors";
import { env } from "server/utils/environment";

// Define interface for request body
interface AIRequestBody {
  assessment: Assessment;
}

interface IndustryAnalysisResult {
  industryCode: string;
}

interface AISuggestionsResult {
  recommendations: string;
  pdfGenerated: boolean;
  pdfPath?: string;
}

interface CompanyData {
  name: string;
  employeeCount: string;
  industry: string;
}

export class AIService {
  private static openai: OpenAI | null = null;

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!env.OPENAI_API_KEY) {
        throw new InternalServerError("OpenAI API key not configured");
      }
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Analyze a website URL and determine its NAICS industry code
   */
  static async analyzeIndustry(url: string): Promise<IndustryAnalysisResult> {
    try {
      const openai = this.getOpenAI();

      // System prompt for industry analysis
      const systemPrompt = `You are an expert industry analyst. Your task is to analyze a website URL and determine the most appropriate NAICS (North American Industry Classification System) industry code.

Guidelines:
1. Analyze the website content, business model, primary products/services, and target market
2. Return ONLY a valid NAICS industry code (number)
3. Choose the most specific and accurate code that matches the primary business activity
4. If the website is unclear or inaccessible, return "UNKNOWN"
5. Do not include explanations, just the code

Examples of valid responses:
- 541511 (Custom Computer Programming Services)
- 722513 (Limited-Service Restaurants)
- 236220 (Commercial and Institutional Building Construction)
- 523110 (Investment Banking and Securities Dealing)`;

      const userPrompt = `Analyze this website and determine its NAICS industry code: ${url}

Please visit the website (if accessible) and analyze:
- Main business activities
- Products or services offered
- Target market and customers
- Business model
- Company description and about page

Return only the NAICS code that best represents this business.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 250,
        temperature: 0.1,
      });

      const industryCode = completion.choices[0]?.message?.content?.trim();

      if (!industryCode || industryCode === "UNKNOWN") {
        throw new ValidationError("Could not determine industry from the provided URL");
      }

      // Validate that the code contains only digits
      if (!/^[0-9]+$/.test(industryCode)) {
        throw new ValidationError("Invalid industry code format detected");
      }

      return { industryCode };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError(`Failed to analyze website industry: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate AI suggestions for an assessment
   */
  static async generateSuggestions(assessment: any): Promise<AISuggestionsResult> {
    try {
      const {
        guest,
        userId,
        answers,
        surveyTemplateId,
      } = assessment;

      // If assessment doesn't have survey questions, fetch them
      let assessmentWithSurvey = assessment;
      if (!assessment.survey?.questions) {
        const survey = await SurveyService.getById(surveyTemplateId);
        if (survey) {
          assessmentWithSurvey = {
            ...assessment,
            survey: {
              id: survey.id,
              title: survey.title,
              questionsCount: survey.questionsCount,
              completionLimit: survey.completionLimit,
              questions: survey.questions,
            }
          };
        }
      }

      // Map answers to question text - simplified for now
      const responses = answers.map((answer: any) => {
        return {
          q: `Question ${answer.q}`,
          a: answer.a,
        };
      });

      // Parse guest data if available
      let company = await this.getCompanyData(guest, userId);

      const openai = this.getOpenAI();

      // Prepare system prompt
      let systemPrompt = this.getIntroText();
      systemPrompt += this.getSectionText();
      systemPrompt += this.getRocksText();
      systemPrompt += this.getEnsureText();
      systemPrompt += this.getBookContext();

      // Create user payload as JSON string
      const userPayload = JSON.stringify({
        categories: getCategoryScores(assessmentWithSurvey as any), // Use assessment with survey data
        ...(responses && { responses }),
        ...(company && { company }),
      });

      // Make API request to OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        temperature: 0.7,
        max_tokens: 16000,
      });

      // Get the response content
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new InternalServerError("No content returned from AI");
      }

      // Extract guest email if available
      let guestEmail = null;
      if (guest) {
        try {
          const guestData = JSON.parse(guest);
          guestEmail = guestData.email;
        } catch (error) {
          // Ignore parsing errors
        }
      }

      // Generate and save PDF automatically after successful recommendations
      let pdfResult = null;
      try {
        // For logged-in users: use userId, for guests: use undefined (will use guest email)
        const pdfUserId = userId || undefined;
        pdfResult = await this.generateAndSavePDF(assessmentWithSurvey, content, pdfUserId, guest);
      } catch (pdfError) {
        console.error("Error during PDF generation:", pdfError);
        // Continue even if PDF generation fails
      }

      return {
        recommendations: content,
        pdfGenerated: pdfResult?.success || false,
        pdfPath: pdfResult?.filePath,
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError(error.message || "Failed to generate AI suggestions");
    }
  }

  /**
   * Get company data from guest or user
   */
  private static async getCompanyData(guest: string | null, userId: number | null): Promise<CompanyData | null> {
    let company = null;
    
    if (guest) {
      try {
        const guestData = JSON.parse(guest);
        company = {
          name: guestData.company || "",
          employeeCount: guestData.employeeCount || "",
          industry: guestData.industry || "",
        };
      } catch (error) {
      }
    } else if (userId) {
      // Get user from database with a fresh query
      const user = await UserService.getById(userId);
      const { company: companyName, employeeCount, industry } = user || {};

      company = {
        name: companyName,
        employeeCount: employeeCount,
        industry: industry,
      };
    }

    return company;
  }

  /**
   * Generate and save PDF with recommendations
   */
  private static async generateAndSavePDF(
    assessment: Assessment,
    content: string,
    userId: number | undefined,
    guest: string | null
  ): Promise<{ success: boolean; filePath?: string; relativePath?: string; error?: string } | null> {
    try {
      // Extract guest email if available
      let guestEmail = null;
      if (guest) {
        try {
          const guestData = JSON.parse(guest);
          guestEmail = guestData.email;
        } catch (error) {
        }
      }

      // Generate PDF with recommendations
      const updatedAssessment = { ...assessment, recommendations: content };
      const pdfResult = await PDFGenerator.generateAndSavePDF(
        updatedAssessment,
        userId,
        guestEmail,
      );

      if (pdfResult.success) {
        // Update assessment with PDF path in database
        try {
          await db
            .update(assessments)
            .set({ pdfPath: pdfResult.relativePath })
            .where(eq(assessments.id, assessment.id));
        } catch (dbError) {
          console.error("Error storing PDF path in database:", dbError);
          // Don't fail the entire operation if PDF path update fails
        }

        // Send email with PDF download link
        try {
          await this.sendAssessmentCompleteEmail(assessment, pdfResult.relativePath!, guest, userId);
        } catch (emailError) {
          console.error("Error sending assessment completion email:", emailError);
          // Don't fail the entire operation if email fails
        }
      }

      return pdfResult;
    } catch (error) {
      console.error("Error during PDF generation:", error);
      return null;
    }
  }

  /**
   * Send assessment completion email
   */
  private static async sendAssessmentCompleteEmail(
    assessment: Assessment,
    pdfRelativePath: string,
    guest: string | null,
    userId: number | undefined
  ): Promise<void> {
    try {
      let recipientEmail = null;
      let recipientName = "Valued User";
      let companyName = "your organization";

      // Get recipient details
      if (guest) {
        try {
          const guestData = JSON.parse(guest);
          recipientEmail = guestData.email;
          recipientName = guestData.name || guestData.firstName || "Valued User";
          companyName = guestData.company || "your organization";
        } catch (error) {
          console.error("Error parsing guest data for email:", error);
        }
      } else if (userId) {
        const user = await UserService.getById(userId);
        if (user) {
          recipientEmail = user.email;
          recipientName = user.name || "Valued User";
          companyName = user.company || "your organization";
        }
      }

      if (recipientEmail) {
        // Build download URL - use REPLIT_DOMAINS if available, otherwise localhost 
        const downloadUrl = `${env.FRONTEND_URL}${pdfRelativePath}`;

        // Render email template
        const emailHtml = await render(AssessmentCompleteEmail({
          recipientName,
          recipientEmail,
          downloadUrl,
          companyName,
        }));

        // Send email
        await EmailService.sendEmail({
          to: recipientEmail,
          subject: "Your MyZone AI Readiness Assessment Results Are Ready!",
          html: emailHtml,
        });

      } else {
      }
    } catch (emailError) {
      console.error("Error sending assessment completion email:", emailError);
      // Don't fail the entire request if email fails
    }
  }

  /**
   * Get intro text for AI prompts
   */
  private static getIntroText(): string {
    return `
You are an intelligent AI assistant designed to support company managers by analyzing performance data across multiple categories. Based on 0 to 10 scores in these categories, generate actionable, prioritized suggestions to improve performance, address weaknesses, and capitalize on strengths. Given the user input, generate a concise, engaging, and actionable report based on the MyZone AI Blueprint.
Produce a Markdown report structured as follows:
`;
  }

  /**
   * Get section text for AI prompts
   */
  private static getSectionText(): string {
    let systemPrompt = `
// === START CATEGORY SECTION ===
// Repeat this block for each category
## {{emoji}} {{category.name}}

*Generate a 4–5-sentence summary, tailored recommendations, and identify patterns or outliers. If scores show critical issues, highlight them with urgency and suggest corrective actions or resources. All suggestions should be practical, data-driven, and context-aware.*

**How You Performed**

* **Current Score:** {{category.score}} / 10 (percentage%)
* **Benchmark:** {{category.benchmark}} / 10 (percentage%)
* **Trend vs. Previous:** Trend (Up by|Down by x points or No change) or First-time assessment

**{{emoji}} Key Best Practices** _(top 3)_`;
    for (let i = 1; i <= 3; i++) {
      systemPrompt += `${i}. …`;
    }

    systemPrompt += `
// === END CATEGORY SECTION ===
`;

    return systemPrompt;
  }

  /**
   * Get rocks text for AI prompts
   */
  private static getRocksText(): string {
    return `
## 🪨 Top 5 AI Rocks for Next Quarter

Here are your **highest-impact, easiest-to-implement AI rocks** for the next 90 days:

_From the list of all Category Best Practices, choose the 5 highest-impact, easiest to implement "rocks." For each:_
1. **{{rock.title}}**  
_Rationale:_ {{rock.rationale}}

…until you list five.
`;
  }

  /**
   * Get ensure text for AI prompts
   */
  private static getEnsureText(): string {
    return `
Inputs:
- JSON object with:
-- categories, each with name, score, previousScore, and benchmark.
-- company data: name, employeeCount, industry.
-- responses, each with question text and answer (-2 to 2 scale, where -2 is strongly disagree, 0 is neutral and 2 is strongly agree).
Output/Ensure:
- Do not create a title for the report - just start with the first category.
- Do not output lines or long dashes between categories.
- Bulleted Markdown, ready for PDF conversion.  
- If 'benchmark' is null, omit that line.
- If 'previousScore' is null, say "First-time assessment" instead of trend.
- Infer an appropriate emoji for each category based on its name and theme.
- Use emoji representing keys for keys best practices headline.
- Highlight critical areas needing immediate attention.
- Keep each Best Practice bullet ≤ 20 words, and rationales ≤ 30 words.
- Tone: Concise, insightful, strategic.
- Avoid fluff or generic advice.
- All insights should be practical, data-informed, and professionally relevant for managerial decision-making in the given company industry context.
`;
  }

  /**
   * Get book context for AI prompts
   */
  private static getBookContext(): string {
    return `
MyZone AI Blueprint for context:
Chapter 1: The AI Wake-Up Call
Welcome to the first chapter of the MyZone AI Blueprint. This guide is designed to help you and your organization prepare for the AI-driven transformation ahead. This isn't about abstract theory or hype—it's about practical, actionable steps to ensure your business not only survives but thrives in the coming decade.
Why This Chapter Matters
AI is not just another technology trend. It is the single most transformative force of our era. From how we communicate, sell, and deliver services, to how we manage teams and structure business models—AI is rewriting the rules of competition. Step 1 of the MyZone AI Blueprint is all about awareness. It's your wake-up call. This is where we install urgency, clarity, and a new mindset.
Objectives of This Chapter
Understand where AI is today and where it's going
Explore why becoming an AI-first organization is non-negotiable
Bust the common myths that stop businesses from starting
Begin your personal and organizational AI transformation timeline
Where AI Stands Today
As of now, AI tools like ChatGPT, Claude, and Gemini are capable of:
Writing complex reports
Performing data analysis
Automating customer service
Supporting strategic decision-making
Summarizing meetings
Coding software
Generating creative content (ads, emails, presentations, etc.)
And this is just the beginning. AI is progressing exponentially. The leap from GPT-3.5 to GPT-4 was significant. The leap from GPT-4 to multi-modal GPT-5 will likely be industry-redefining.
Businesses that adapt to this wave will enjoy a 10x to 100x efficiency gain. Those that don't will be left behind. AI adoption follows the classic technology adoption curve—and we are quickly transitioning from early adopters to early majority.
Where AI is Going
The AI tools of the near future will:
Operate as autonomous agents capable of multi-step tasks
Proactively suggest optimizations and act on data
Interface with any platform or software via natural language
Become digital employees that manage workflows
Imagine:
An AI that runs your entire marketing funnel
An AI that replaces your customer service team
An AI that prepares board-ready strategic insights every week
This isn't science fiction—it's happening now. Your competitors are either already building these capabilities or will be very soon.
Why You Must Become an AI-First Organization
To win in the AI age, companies must become AI-first. That means:
Educating all team members on how to use AI
Documenting and mapping processes that AI can augment or automate
Building a flexible, innovation-ready culture
Investing in proprietary data and automation-ready infrastructure
If you wait until AI is "mainstream," you're already too late. The gap between what businesses understand and what technology can do is widening daily.
This is your chance to become one of the few who lead the AI transformation, rather than react to it.
We'll show you how—step-by-step—in this 10-part Blueprint that takes you from awareness all the way through strategy, tooling, automation, and ultimately, transformation. You'll learn how to crawl, walk, run, and eventually fly.
The AI Wake-Up Toolkit
1. Personal AI Impact Timeline
Create a 1, 3, 5, and 10-year vision:
How will AI impact your job?
How will AI impact your company?
How will AI transform your industry?
We recommend using AI itself to assist with this—prompt your GPT or chatbot with these questions and let it guide your foresight process.
2. AI Disruption Library
Read real-world case studies of companies disrupted or empowered by AI. Examples include:
Legal firms automating contract review
E-commerce brands automating customer support
Agencies generating content using AI
We encourage you to add to this library by researching disruptions in your own industry.
3. Foundational Myth Busting
Let's dismantle the top three myths:
Myth 1: "AI is too expensive."
Reality: AI can be extremely affordable. Most of the tools you'll need start at $20–$40/month per user, and many are free. When implemented strategically, AI pays for itself through automation and efficiency.
Myth 2: "I don't have time to learn or implement AI."
Reality: Saying you're too busy to automate your business is like saying you're too busy washing dishes to buy a dishwasher. The ROI on time saved is massive.
Myth 3: "AI is too complicated."
Reality: If you've ever posted a blog, built a website, or sent an email campaign—you can learn AI. The key is learning how to talk to it.
This is not about becoming an engineer or a prompt wizard. It's about becoming fluent in how to use AI to assist and accelerate what you already do.
Final Thought: Your Mindset Is the First System to Upgrade
Before any technical implementation, tool deployment, or training, your mindset must shift. AI isn't just a tool. It's a new operating system for work and life.
If you embrace this now, everything you learn in future steps will click faster, produce better results, and generate exponentially more value.
Let this be your turning point.
[Additional chapters continue with similar detailed content about AI readiness, education, tools, strategy, data, process mapping, prioritization, execution, and transformation...]
`;
  }
}

