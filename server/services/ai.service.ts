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
        throw new ValidationError(
          "Could not determine industry from the provided URL",
        );
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
      throw new InternalServerError(
        `Failed to analyze website industry: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI suggestions for an assessment
   */
  static async generateSuggestions(
    assessment: any,
  ): Promise<AISuggestionsResult> {
    try {
      const { guest, userId, answers, surveyTemplateId } = assessment;

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
            },
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

      // Make API request to OpenAI with JSON mode for structured output
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 25000,
      });

      // Get the response content
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new InternalServerError("No content returned from AI");
      }

      // Parse JSON response
      let recommendationsData;
      try {
        recommendationsData = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        throw new InternalServerError("Invalid JSON response from AI");
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
        pdfResult = await this.generateAndSavePDF(
          assessmentWithSurvey,
          recommendationsData,
          pdfUserId,
          guest,
        );
      } catch (pdfError) {
        console.error("Error during PDF generation:", pdfError);
        // Continue even if PDF generation fails
      }

      return {
        recommendations: recommendationsData,
        pdfGenerated: pdfResult?.success || false,
        pdfPath: pdfResult?.relativePath,
      };
    } catch (error: any) {
      if (
        error instanceof ValidationError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      throw new InternalServerError(
        error.message || "Failed to generate AI suggestions",
      );
    }
  }

  /**
   * Get company data from guest or user
   */
  private static async getCompanyData(
    guest: string | null,
    userId: number | null,
  ): Promise<CompanyData | null> {
    let company = null;

    if (guest) {
      try {
        const guestData = JSON.parse(guest);
        company = {
          name: guestData.company || "",
          employeeCount: guestData.employeeCount || "",
          industry: guestData.industry || "",
        };
      } catch (error) {}
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
    content: string | import("@shared/schema").RecommendationsV2,
    userId: number | undefined,
    guest: string | null,
  ): Promise<{
    success: boolean;
    filePath?: string;
    relativePath?: string;
    error?: string;
  } | null> {
    try {
      // Extract guest email and company name if available
      let guestEmail = null;
      let companyName = null;
      if (guest) {
        try {
          const guestData = JSON.parse(guest);
          guestEmail = guestData.email;
          companyName = guestData.company;
        } catch (error) {}
      } else if (userId) {
        // Get user company name
        const user = await UserService.getById(userId);
        companyName = user?.company;
      }

      // Generate PDF with recommendations
      const updatedAssessment = { ...assessment, recommendations: content };
      const pdfResult = await PDFGenerator.generateAndSavePDF(
        updatedAssessment,
        userId,
        guestEmail,
        companyName,
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

        // Send email with PDF download link and attachment
        try {
          await this.sendAssessmentCompleteEmail(
            assessment,
            pdfResult.relativePath!,
            pdfResult.buffer,
            pdfResult.fileName!,
            guest,
            userId,
          );
        } catch (emailError) {
          console.error(
            "Error sending assessment completion email:",
            emailError,
          );
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
    pdfBuffer: Buffer | undefined,
    fileName: string,
    guest: string | null,
    userId: number | undefined,
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
          recipientName =
            guestData.name || guestData.firstName || "Valued User";
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
        const emailHtml = await render(
          AssessmentCompleteEmail({
            recipientName,
            recipientEmail,
            downloadUrl,
            companyName,
          }),
        );

        // Prepare attachments if buffer is available
        const attachments = pdfBuffer
          ? [
              {
                name: fileName,
                contentType: "application/pdf",
                contentBytes: pdfBuffer.toString("base64"),
              },
            ]
          : undefined;

        // Send email with BCC to sales team and PDF attachment
        await EmailService.sendEmail({
          to: recipientEmail,
          subject: "Your Keeran AI Readiness Assessment Results Are Ready!",
          html: emailHtml,
          bcc: "sales@keeran.ca",
          attachments,
        });
      } else {
      }
    } catch (emailError) {
      console.error("Error sending assessment completion email:", emailError);
      // Don't fail the entire request if email fails
    }
  }

  /**
   * Get intro text for AI prompts (V2 - JSON Format)
   */
  private static getIntroText(): string {
    return `
You are an intelligent AI assistant designed to support company managers by analyzing performance data across multiple categories. Based on 0 to 10 scores in these categories, generate actionable, prioritized suggestions to improve performance, address weaknesses, and capitalize on strengths.

Generate a structured JSON report based on the MyZone AI Blueprint. Do not include any EOS (Entrepreneurial Operating System) terminology for legal reasons. Language should be business-generic.

Your response MUST be valid JSON matching this exact structure:
{
  "intro": "100-150 word summary of overall performance, trends, and key insights. Highlight critical areas needing immediate attention and how Keeran Networks could potentially help with these issues and why it's important to get these things fixed.",
  "categories": [
    {
      "name": "Category Name",
      "emoji": "📊",
      "title": "Category Title",
      "description": "4-5 sentence summary with tailored recommendations, patterns, and outliers. If scores show critical issues, highlight them with urgency and suggest corrective actions.",
      "performance": {
        "currentScore": 7.5,
        "benchmark": 6.2,
        "trend": "Up by 1.2 points" or "First-time assessment" or null
      },
      "bestPractices": [
        "Best practice 1 (max 20 words)",
        "Best practice 2 (max 20 words)",
        "Best practice 3 (max 20 words)"
      ]
    }
  ],
  "outro": "Concluding remarks with top 5 highest-impact, easiest-to-implement AI rocks for the next 90 days. Format as markdown with numbered list and rationales (max 30 words each)."
}
`;
  }

  /**
   * Get section text for AI prompts (V2 - not used in JSON mode)
   */
  private static getSectionText(): string {
    return ""; // No longer needed - JSON structure defined in getIntroText
  }

  /**
   * Get rocks text for AI prompts (V2 - not used in JSON mode)
   */
  private static getRocksText(): string {
    return ""; // No longer needed - included in outro field
  }

  /**
   * Get ensure text for AI prompts (V2 - JSON Guidelines)
   */
  private static getEnsureText(): string {
    return `
Inputs:
- JSON object with:
  - categories: each with name, score, previousScore, and benchmark
  - company data: name, employeeCount, industry
  - responses: each with question text and answer (-2 to 2 scale)

Output Requirements:
- MUST return valid JSON matching the exact structure provided
- If benchmark is null/undefined, use null in performance.benchmark
- If previousScore is null/undefined, set trend to "First-time assessment"
- Infer appropriate emoji for each category based on its name and theme
- Highlight critical areas needing immediate attention
- Keep each best practice ≤ 20 words
- Keep outro rationales ≤ 30 words each
- Tone: Concise, insightful, strategic
- Avoid fluff or generic advice
- All insights should be practical, data-informed, and professionally relevant for the given industry context
- The outro should include top 5 AI rocks formatted as markdown numbered list with bold titles and italic rationales
`;
  }

  /**
   * Get book context for AI prompts
   */
  private static getBookContext(): string {
    return `
MyZone AI Blueprint for context:
Chapter 1: The AI Wake-Up Call
Welcome to the first chapter of the MyZone AI Blueprint. This guide is designed to help you and your organization prepare for the AI-driven transformation ahead. This isn’t about abstract theory or hype—it’s about practical, actionable steps to ensure your business not only survives but thrives in the coming decade.
Why This Chapter Matters
AI is not just another technology trend. It is the single most transformative force of our era. From how we communicate, sell, and deliver services, to how we manage teams and structure business models—AI is rewriting the rules of competition. Step 1 of the MyZone AI Blueprint is all about awareness. It’s your wake-up call. This is where we install urgency, clarity, and a new mindset.
Objectives of This Chapter
Understand where AI is today and where it’s going
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
Businesses that adapt to this wave will enjoy a 10x to 100x efficiency gain. Those that don’t will be left behind. AI adoption follows the classic technology adoption curve—and we are quickly transitioning from early adopters to early majority.
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
This isn’t science fiction—it’s happening now. Your competitors are either already building these capabilities or will be very soon.
Why You Must Become an AI-First Organization
To win in the AI age, companies must become AI-first. That means:
Educating all team members on how to use AI
Documenting and mapping processes that AI can augment or automate
Building a flexible, innovation-ready culture
Investing in proprietary data and automation-ready infrastructure
If you wait until AI is "mainstream," you’re already too late. The gap between what businesses understand and what technology can do is widening daily.
This is your chance to become one of the few who lead the AI transformation, rather than react to it.
We’ll show you how—step-by-step—in this 10-part Blueprint that takes you from awareness all the way through strategy, tooling, automation, and ultimately, transformation. You’ll learn how to crawl, walk, run, and eventually fly.
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
Let’s dismantle the top three myths:
Myth 1: "AI is too expensive."
Reality: AI can be extremely affordable. Most of the tools you’ll need start at $20–$40/month per user, and many are free. When implemented strategically, AI pays for itself through automation and efficiency.
Myth 2: "I don’t have time to learn or implement AI."
Reality: Saying you’re too busy to automate your business is like saying you’re too busy washing dishes to buy a dishwasher. The ROI on time saved is massive.
Myth 3: "AI is too complicated."
Reality: If you’ve ever posted a blog, built a website, or sent an email campaign—you can learn AI. The key is learning how to talk to it.
This is not about becoming an engineer or a prompt wizard. It’s about becoming fluent in how to use AI to assist and accelerate what you already do.
Final Thought: Your Mindset Is the First System to Upgrade
Before any technical implementation, tool deployment, or training, your mindset must shift. AI isn’t just a tool. It’s a new operating system for work and life.
If you embrace this now, everything you learn in future steps will click faster, produce better results, and generate exponentially more value.
Let this be your turning point.
Chapter 2: AI Readiness Assessment
Now that the wake-up call has rung, it’s time to take inventory. Step 2 of the MyZone AI Blueprint is where you begin to understand your organization’s current AI maturity—from technical capabilities to cultural mindset. Think of this step as your AI checkup—a diagnostic to see how ready you are to evolve.
Why This Chapter Matters
Jumping into AI without understanding your baseline is like launching a rocket without calibrating the trajectory. This step ensures your AI journey is aligned, efficient, and focused.
We evaluate both individual and organizational readiness because successful AI adoption is not just about tools—it’s about the people and processes surrounding them.
Objectives of This Chapter
Assess the digital and AI literacy of key team members
Evaluate organizational systems, culture, and structure for AI alignment
Create benchmarks for future measurement and quarterly progress
Personal AI Proficiency
Every company has varying levels of digital literacy. This part of the assessment focuses on:
Comfort using AI tools like ChatGPT or MidJourney
Ability to create prompts, roleplay, summarize, analyze, or ideate with AI
Openness to using AI in day-to-day work
Time investment capacity
We are not looking for engineers or coders. We’re looking for curious problem-solvers—people who are willing to experiment, iterate, and improve.
Organizational AI Readiness
This section examines the structural side of your business:
Do you have all of your core processes documented?
Are your systems API-connected?
Do you have centralized, labeled, accessible data?
Is your leadership committed to innovation?
Is there cultural resistance to change?
By scoring these components quarterly, you’ll track your journey from AI-aware to AI-powered.
The AI Readiness Toolkit
1. AI Readiness Radar
We provide you with a spider chart to visualize:
Team education level
Process clarity
System integration
Data structure
Innovation culture
Strategic alignment
You’ll update this quarterly to track growth.
2. Team AI Sentiment Audit
We anonymously gather input from your team on:
Excitement vs. fear
Openness to learning
Trust in leadership around AI
This quarterly audit helps us understand hidden resistance or allies, so we can focus coaching efforts where they’ll have the most impact.
3. Role-Based Readiness Templates
Different roles require different AI readiness. (We’ll be building these templates in more detail as part of your evolving curriculum.) For now, just understand that a marketer, a COO, and an executive each have unique AI adoption paths.
This early awareness allows us to reduce friction and make education more relevant and strategic.
Final Thought: Progress Begins With Clarity
AI transformation isn’t something you do once—it’s something you measure, nurture, and evolve continuously.
The Readiness Assessment is your alignment compass. Use it to orient your energy, focus your investment, and grow your internal AI champions with confidence.
Chapter 3: AI Education
Once you’ve acknowledged the wake-up call and assessed your readiness, it’s time to upgrade the real infrastructure that powers transformation: your people.
Step 3 of the MyZone AI Blueprint is all about education. We’re not talking about technical certifications or becoming machine learning engineers. This is about making sure everyone in your organization knows how to use AI to think, learn, create, and perform better.
Why This Chapter Matters
AI won’t replace people—it will replace people who don’t know how to use AI.
Education is the single highest ROI investment you can make in this transformation. It reduces fear, sparks innovation, and empowers your team to move from passive observers to active builders.
Objectives of This Chapter
Help every team member build AI confidence and fluency
Introduce frameworks for effective prompting and learning
Train individuals to personalize their learning journey with AI as their coach
What AI Education Looks Like
Education in the Blueprint isn’t one-size-fits-all. It’s:
Role-based
Behavior-based
Delivered in layers based on experience and interest
It’s about using AI to amplify strengths, not force everyone into the same template.
Key foundational skills we build include:
Prompting with the CREATE framework
Using voice-to-AI tools to talk instead of type
Roleplaying, brainstorming, and learning faster with AI
Teaching AI to teach you back
Summarizing articles, books, or meetings
Asking AI to build checklists, plans, and guides
Tracking your progress and iterating based on feedback
The AI Education Toolkit
1. AI Learning Journal
Every team member keeps a journal (digital or physical) of:
Prompts they tried
What worked and didn’t
Lessons learned
Use cases discovered
This builds pattern recognition, reflection, and long-term mastery.
2. AI as Your Learning Coach
We help clients build a custom GPT or chatbot to:
Ask learning questions
Quiz them on concepts
Recommend resources
Assign personalized micro-assignments
This is like hiring a digital mentor that works 24/7.
3. Micro-Challenges by Role
After every coaching session, clients receive:
Tiny assignments
Personalized by department and skill level
Reviewed together during follow-ups
These micro-challenges help employees develop confidence and consistency in real work situations.
4. Learn in Teams & Communities
Learning is amplified in community. That’s why we encourage:
Forming learning tribes via Slack, WhatsApp, or internal channels
Joining EO groups or like-minded executive cohorts
Creating departmental forums for sharing prompts, wins, and challenges
Whether it’s a CEO group or a marketing AI pod, shared learning drives faster adoption and accountability.
Final Thought: Your Brain + AI Is the New Superpower
Education isn’t about reaching some imaginary finish line. It’s about building a team that sees AI as an extension of their intelligence.
The companies that will win aren’t the ones with the most data or budget—they’re the ones who build a culture where AI is a natural part of how work gets done.
Chapter 4: Tools
You’ve awakened to the power of AI, assessed your organization’s readiness, and begun building a learning culture. Now it’s time to get your hands dirty with the actual tools that will power your transformation.
Step 4 of the MyZone AI Blueprint is all about equipping your team with the best and most appropriate AI tools—and teaching them how to use them effectively.
Why This Chapter Matters
You can have a great strategy and an eager team—but without the right tools, you’re flying blind. The tools you choose will define the speed, scale, and success of your AI journey.
This chapter is not just about installing software. It’s about building a systemized, repeatable approach to:
Prompting
Custom GPT creation
Chatbot deployment
Integration with internal workflows
Objectives of This Chapter
Introduce foundational tools for AI-enhanced work
Teach prompt engineering using the CREATE framework
Establish systems for saving, evolving, and scaling prompt libraries
Distinguish between custom GPTs and enterprise-grade RAG chatbots
Tool Categories You’ll Master
We organize AI tools into 4 tiers:
1. Core Foundation Tools
ChatGPT (Pro / Team)
Custom GPTs with memory
Voice input & mobile access
NotebookLM (Google)
These are your general-purpose productivity and strategy tools.
2. Role-Specific AI Tools
Designers: MidJourney, Adobe Firefly
Developers: Replit, Firebase, Cursor AI, GitHub Copilot
Presenters: Gamma.app, Tome
Analysts: ChatGPT + advanced data plugins
We teach which tools are right for which roles, and how to pick tools that fit your goals, systems, and skill levels.
Note: The rate at which new tools are being shipped to the world is accelerating exponentially. What’s cutting-edge today may be table stakes next quarter. Because of this:
The MyZone AI team is constantly testing and evaluating new tools, features, and capabilities
We’ve embedded a "What’s New in AI" section into our regular coaching calls
You’ll frequently get live updates like: “ChatGPT 4.1 just launched with developer mode—here’s what it means,” or “Google Firebase’s agentic model is now competing with Replit—when should you use which?”
This is a dynamic and ever-changing landscape, and staying current is part of the transformation. AI is now building the next generation of tools—so the speed of innovation is not just fast, it’s self-accelerating.
3. Prompt Systems
We teach the CREATE Framework:
Context
Role
Example
Ask me questions
Task
Enhance & Iterate
You’ll learn how to:
Write prompts that improve over time
Save and reuse effective prompts
Build your own Prompt OS
Use macros or snippets to insert prompts anywhere
4. Custom GPTs vs. MyZone AI Chatbots
We help clients understand the tradeoffs:
Custom GPTs
MyZone AI Chatbots (RAG)
Use Case
Individual productivity & learning
Team-wide knowledge access
Data Storage
Memory-based (limited)
Connects to SOPs, APIs, knowledge bases
UI
ChatGPT interface
Web widgets, Slack, Make.com integration
Customization
Easy to configure by user
Engineered by MyZone AI team
Both are important. We teach when to use which, and how to scale each.
The AI Tooling Toolkit
1. Prompt Operating System (Prompt OS)
Use Notion, Coda, or Sheets to build a personal or teamwide prompt repository:
Categorize by role, function, format
Include success ratings and versioning
This becomes your AI memory bank.
2. Top 25 ChatGPT Use Cases
We provide interactive walkthroughs of use cases by department:
Sales
Ops
Marketing
Finance
Admin
Each one is tested, proven, and easy to replicate.
3. Custom GPT & Chatbot Showroom
We give you access to real working GPTs and chatbots:
SOP bots
Strategy bots
Website customer support bots
And your Blueprint subscription includes a free license to MyZone AI Chatbots, which we encourage you to lean on as much as possible.
Final Thought: Tools Are Only as Powerful as the System That Uses Them
Tools are not magic wands. They are accelerators. When plugged into the right system—with a trained team, clear strategy, and strong data foundation—they unlock exponential impact.
The goal is not to become a tool junkie. The goal is to build a stack that scales—automating, enriching, and empowering your business to operate faster, smarter, and with fewer roadblocks.
Chapter 5: AI Strategy
With a strong foundation of education, tools, and readiness, it’s time to move from execution to elevation. Step 5 of the MyZone AI Blueprint is Strategy—building a plan that doesn’t just use AI, but leverages it to transform your decision-making, positioning, and long-term direction.
This is where AI becomes your thought partner, competitive analyst, and strategic co-pilot.
Why This Chapter Matters
Tactical wins are great—but without strategy, you risk automating your way into irrelevance. Interestingly, AI Strategy was originally positioned as Step 2 in the MyZone AI Blueprint. However, after running a full blueprint analysis using AI itself, we realized that steps 1 through 4 lay essential groundwork that dramatically improves the quality of strategic thinking.
Clients gain confidence, context, and clarity from foundational wins in awareness, readiness, education, and tools. Once those are in place, strategic conversations become deeper, more creative, and more aligned with actual execution capacity.
So while most business frameworks place strategy first, we let AI guide our order—and the result has been overwhelmingly positive.
This chapter now meets you at a point of strength, not speculation. It’s where all your early momentum turns into long-term direction.
Objectives of This Chapter
Introduce AI as a strategic co-pilot for founders and executives
Build custom GPTs and chatbots for decision support
Leverage deep research workflows for data-backed strategy
Define an innovation-aligned AI-first culture and core values
The Role of AI in Strategy
AI is not just for writing blog posts and summarizing meetings—it can:
Analyze industry trends
Model financial forecasts
Generate scenarios and simulate decisions
Monitor competitor signals and product launches
Assist in positioning, pricing, and M&A strategy
We teach you how to use AI to expand your strategic thinking capacity—and run higher-quality decisions, faster.
Strategic AI Tools You’ll Use:
Custom GPTs (with memory or static context)
RAG chatbots trained on your strategic playbooks
Automated market research prompts and workflows
Monthly competitive intelligence comparison trackers
The AI Strategy Toolkit
1. AI-Augmented SWOT Prompts
Use a GPT to run SWOT analyses (Strengths, Weaknesses, Opportunities, Threats) on:
Your company
Key competitors
Product lines
Market opportunities
Get deeper insight than you would from traditional frameworks alone.
2. Future Scenarios Generator
Ask your AI assistant to help simulate:
Best-case and worst-case scenarios
Technology-driven disruptions
Macro trends that could shift your industry
This type of future forecasting helps you build anti-fragile strategies that thrive in uncertainty.
3. AI-Powered KPIs
Align your KPIs (Key Performance Indicators) with:
Your IPA roadmap
Departmental automation goals
Quarterly AI milestones
We help you build AI that supports execution as well as ideation.
Embedding Strategic AI Into Company Culture
Innovation & Adaptability as Core Values
If your company’s values don’t include:
Innovation (embracing what’s next)
Adaptability (flexibility in fast-moving environments)
you’re going to struggle to scale AI.
We help every client audit and revise their core values to align with being an AI-first organization. These values must be lived in hiring, feedback, planning, and leadership communication.
Strategic Role-Play Simulations
We simulate how you’d:
Present an AI-driven strategy shift to your board or exec team
Address objections
Align teams around the vision
This lets you test change management dynamics in advance, before rolling it out organization-wide.
Final Thought: AI Strategy Is a Team Sport
AI strategy isn’t a one-and-done. It’s a new layer in the way your company thinks. The smartest leaders build systems where AI doesn’t just assist—but challenges, enhances, and evolves their decision-making.
If you want to lead your market—not follow—it starts here.
Chapter 6: Data
If strategy is the brain of your AI-powered business, data is the bloodstream. Without clean, labeled, centralized, and accessible data, your automations, analytics, and AI models will be flying blind.
Step 6 of the MyZone AI Blueprint is where we help you turn scattered information into organized intelligence—and make sure your future systems are trained on high-quality signals, not noise.
Why This Chapter Matters
AI thrives on data—but not just any data. It needs:
Structured, well-labeled information
Connected, centralized systems
Human-verified truth
Secure, ethical storage
This chapter teaches you how to build a foundation that ensures every future automation, model, or chatbot you deploy is pulling from reliable, well-organized information.
Objectives of This Chapter
Map and diagram your company’s data flow
Assign ownership for data strategy and documentation
Standardize naming conventions, channels, and workflows
Prepare your data for intelligent process automation and RAG bots
Understanding the Data Layer
Think of your data in three tiers:
1. Core Business Data
CRM records
Financials
Client onboarding forms
Product specs
Support tickets
2. Unstructured Communication Data
Slack, Teams, and email threads
Meeting transcripts
Internal project notes
3. External or Enriched Data
Purchased datasets (e.g., Apollo, Nielsen)
Industry benchmarks
IoT sensors and 3rd-party APIs
The goal is to bring all of this into a centralized, connected system that’s accessible, trainable, and secure.
The Data Toolkit
1. Data Flow Diagram Templates
Map how data enters, moves through, and exits your business
Visualize system gaps, duplications, and silos
2. Slack & Teams Documentation Strategy
Channel-based naming conventions (e.g. #sop-sales, #data-insights)
Label conversations, share files, and create training-friendly workflows
3. Agentic Enrichment Workflows
 Using platforms like Make.com or N8n to:
Auto-tag CRM fields
Monitor competitors
Auto-log summaries and KPIs into dashboards
4. Centralization & API Readiness
Ensure systems are API-compatible
Evaluate middleware to sync legacy tools
Prepare for agentic workflows that depend on data interoperability
Best Practices for Future-Proofing
1. Store Everything in High Fidelity
 Text summaries are great—but store original files too:
Full Zoom recordings
4K training videos
Raw creative assets
Long-form email threads
2. Appoint a Data Steward
 Every business needs someone who owns:
Labeling practices
Access permissions
Quality and freshness of data
Preparation for RAG-based chatbots and future LLM training
3. Prioritize First-Party Data
 Your own data is gold.
Meeting recordings
Project outcomes
Operational logs
 This becomes the backbone of your future automations, chatbots, and analytics tools.
Real-World Challenges and Solutions
Too often, we see:
Free Slack plans that delete data after 10,000 messages
Unrecorded EOS offsite meetings where strategic gold is lost
In-person client meetings with no transcripts or audio logs
Zoom accounts without adequate cloud storage
Employees leave—and all their insight leaves with them
For about $100/month, you can store years worth of Zoom calls, searchable and secure. This becomes your team’s long-term memory.
We’ve also seen clients:
Use voice memos on an iPhone to record client meetings
Transcribe those recordings using AI
Feed the transcript into a custom GPT
Automatically generate follow-up emails, project tasks, and dashboard updates
This is the power of data-to-action workflows.
Final Thought: Your Data Is Your Moat
The most powerful AI systems aren’t just smart—they’re trained on data no one else has. You already have this data—it’s just unstructured and scattered.
Your job now is to centralize it, clean it, and make it AI-readable.
That’s what this step is about: turning raw knowledge into scalable intelligence.
Chapter 7: Process Mapping
With your data structured and your team empowered, it’s time to make the invisible visible.
Step 7 of the MyZone AI Blueprint is all about Process Mapping—capturing how your business actually works, not just how you think it works. This is the foundation that allows automation, optimization, and delegation to become real.
Why This Chapter Matters
You can’t automate what you can’t see.
Most companies run on tribal knowledge. Critical workflows exist only in people’s heads or scattered Slack threads. This creates bottlenecks, inconsistencies, and fragile operations.
Mapping your processes is how you unlock:
Visibility into inefficiencies
Clear documentation for training and automation
A reliable roadmap for intelligent process automation (IPA)
Objectives of This Chapter
Identify and catalog your recurring processes
Measure time, frequency, and cost of each workflow
Document pain points and complexity
Capture in a format AI developers can use
What We Mean by 'Process'
A process is any repeatable workflow that:
Takes more than a few steps
Happens on a regular basis
Requires multiple tools or people
Costs time, energy, or money
Examples:
New employee onboarding
Campaign creation and launch
Invoicing and payment follow-up
Quality assurance review
If it’s repeated and costs resources—it’s mappable.
The Process Mapping Toolkit
1. Process Inventory Spreadsheet
 We use a simple template to gather:
Process name and owner
Department
Time per execution
Frequency per month
Hourly cost
Estimated annual cost
Friction or failure points
How much of it could be automated (rough estimate)
2. Custom GPT Interview Tool
 Instead of asking your team to write SOPs from scratch, we provide a custom GPT that interviews them:
Asks structured questions
Captures steps, exceptions, and conditions
Outputs standardized documentation
This reduces documentation time by over 90%.
3. Automation Readiness Scorecard
 Each process is evaluated based on:
Estimated ROI from automation
Technical complexity
% of steps automatable
Alignment with strategic priorities
Clarity and consistency of current process
The result? A sortable list of automation-ready workflows.
Common Roadblocks (and Fixes)
Problem: “We don’t have time to document.”
 Fix: Use the custom GPT to interview instead of writing SOPs manually.
Problem: “We don’t know where to start.”
 Fix: Start with high-cost, high-frequency processes. Then tackle bottlenecks.
Problem: “Our team resists process documentation.”
 Fix: Frame it as a path to delegation and innovation—not bureaucracy.
Advanced Insight: SOPs + Chatbots
In later steps, your process documentation becomes fuel for intelligent systems:
SOP-based chatbots in Slack and Teams
Searchable internal knowledgebases
New employee onboarding assistants
Automated update/version control of SOPs using AI
For example, a new hire could use a training bot to:
Ask, “How do I request PTO?”
Get the answer from your live SOP
Take a quiz generated by AI to test their understanding
This isn’t just documentation—it’s enablement infrastructure.
Final Thought: You Can’t Improve What You Don’t Map
This step is about clarity. Once mapped, every process becomes:
Visible
Optimizable
Automatable
Process Mapping is where AI stops being theory and starts being reality.
—
Chapter 8: Prioritization
Once your processes are mapped, the next question becomes:
 Which ones should we automate first?
Step 8 of the MyZone AI Blueprint is about Prioritization—where we translate insights into action. This is how we decide which automations generate the fastest, highest-impact wins with the least resistance.

Why This Chapter Matters
Without a clear prioritization framework, companies fall into two traps:
They automate what’s easy—but not valuable
They delay action because everything feels equally important
We solve this with structure. Our system helps you focus energy where ROI is highest, resistance is lowest, and results are fastest.
Objectives of This Chapter
Calculate automation ROI across mapped processes
Score based on complexity, value, and strategic fit
Build your first Intelligent Process Automation (IPA) roadmap
The MyZone 3-Part Prioritization Framework
We score every process based on:
1. ROI Potential
We estimate:
Time spent today
Hourly cost
Frequency
% of steps we can automate
 From that, we forecast annual savings and payback period.
2. Impact & Time to Impact
Some low-cost processes still create massive friction.
 We consider:
Employee morale
Customer experience
Team velocity
How soon the results show up
A 2-week win is more valuable than a 2-year build.
3. Organizational Readiness
Even high-ROI automations can flop without the right people in place.
 We assess:
Team availability
Process clarity
Tech stack compatibility
Stakeholder buy-in
 This ensures your roadmap is not just smart—it’s realistic.
The Prioritization Toolkit
1. ROI Calculator Template
 A plug-and-play spreadsheet that auto-scores all mapped processes based on:
Value
Effort
Risk
Speed
This surfaces your best quick wins and longer-term bets.
2. IPA Roadmap Board
 A Kanban-style board (digital or physical) that shows:
Shortlist of processes to automate
Status of each (scoping, building, testing, launched)
Estimated ROI and owner per process
This becomes your automation command center.
3. Alignment Check-In Script
 Before moving forward with any automation, we ask:
Does this align with our quarterly priorities?
Do we have a clear internal champion?
Will this require external dev help or support?
If the answer is murky, we delay—not delete.
Pro Tip: Crawl Before You Fly
Visionary CEOs love to start with huge ideas. But at this stage, we emphasize:
Crawl → Walk → Run → Fly
Start with low-complexity, high-frequency processes that prove the concept and build internal trust.
AI tools and markets are evolving so fast, prioritizing fast impact is more important than ever. What takes six months today could be obsolete by next quarter.
As Jim Collins says in Good to Great:
“The flywheel builds momentum—push after push—turn after turn. Then at some point, there’s a breakthrough.”
Your IPA roadmap is your flywheel. Pick the right processes, in the right order, and you'll soon find compounding momentum.
Final Thought: Strategic Focus Wins
Automating everything isn’t the goal.
 Automating the right things is.
Prioritization is the bridge between documentation and execution. It’s how you stop theorizing and start compounding.
—
Chapter 9: Execution
You’ve mapped your processes. You’ve prioritized your automation roadmap. Now it’s time to build.
Step 9 of the MyZone AI Blueprint is Execution—the hands-on phase where theory becomes workflow, and automation becomes real.
This is where Intelligent Process Automation (IPA) starts generating measurable ROI.
Why This Chapter Matters
Without execution, strategy is just a well-organized to-do list.
But execution done wrong leads to:
Scope creep
Missed expectations
Burnt-out teams
This chapter is about avoiding those pitfalls with clear:
Ownership
Collaboration
Scope definition
Feedback loops
Objectives of This Chapter
Conduct deep discovery with process owners
Translate mapped processes into build-ready scopes
Align budget, timeline, and responsibility
Launch, test, and iterate with HITL (Human-in-the-Loop) oversight
The Execution Workflow
1. Discovery & Scoping
We pair each process owner (on your team) with an IPA architect (on ours). Together, they:
Walk through the current workflow
Clarify inputs, exceptions, and bottlenecks
Identify edge cases
From there, we draft a technical scope, including:
Visual diagrams
API connections
Required integrations
Time and cost estimates
2. Build & Test
Once approved:
Our team builds the automation using tools like Make.com, N8n, or custom code
We run internal QA
You receive a staging version to test
You review performance, flag edge cases, and suggest refinements.
3. Launch & HITL Oversight
When approved, we launch to production.
The process owner becomes the Human-in-the-Loop, responsible for:
Monitoring logs and performance
Identifying new exceptions
Suggesting updates or features
Acting as the feedback loop for continual learning
The Execution Toolkit
1. AI-Powered Discovery Recorder
 We record and transcribe discovery calls, then use AI to auto-generate:
Meeting summaries
Initial technical scope
Stakeholder to-do lists
2. Process Owner Quick Start Guide
 Each internal owner receives a toolkit explaining:
Their role pre-, during-, and post-build
What to watch for
How to test and escalate issues
How to assess early ROI
3. Feedback Tracker + Optimization Loop
 Every automation gets:
A feedback log (structured or freeform)
A quarterly optimization review
A running wishlist for future enhancements
Because automations should evolve with the business.
Advanced Tip: Train the HITL to Become the Builder
Many low-code tools are now learnable by non-technical users.
 We’ve had clients:
Master Make.com to launch their own automations
Use Replit AI agents to build internal bots
Extend automations without touching code
The goal is to elevate your people—from operators to systems architects.
Mindset Shift: From Doing to Delegating
Execution isn’t about replacing people. It’s about freeing them up.
We train your team to:
Work on the business, not just in it
Think like systems designers
Delegate with confidence to automation and AI
Every automation deployed = more time, more clarity, more scale.
Final Thought: Build with Confidence
The key to successful execution isn’t perfection—it’s collaboration.
When your process owners and our automation architects work hand-in-hand, you get:
Faster build cycles
Higher adoption
Stronger outcomes
And over time, your team becomes fully fluent in launching, scaling, and owning its own automations.
–
Chapter 10: AI Transformation
You’ve educated your team. You’ve organized your data. You’ve mapped and automated your core processes. And you’re starting to see real results.
Now it’s time to zoom out and ask the biggest question of all:
“What could our business become if AI was at the very core?”
This is the flying stage of Crawl → Walk → Run → Fly.
Why This Chapter Matters
We intentionally save this for the end—because transformation ideas often:
Require capital
Involve longer timelines
Carry greater risk
Demand a foundation of operational excellence
Once Steps 1–9 are humming and generating ROI, it’s time to reinvest that time and profit into reimagining your business.
This is where companies shift from AI-powered to AI-native.
Objectives of This Chapter
Identify your Massive Transformative Purpose (MTP)
Explore long-term strategies for reinvention and scale
Productize what you’ve built
Create industry-level disruption—or prepare to be disrupted
Paths to Transformation
1. From Services to SaaS
If you’ve built a repeatable AI automation engine, why not sell it?
Launch a SaaS version of your delivery model
Package your systems into software
Sell implementation services to others in your industry
You're no longer just an operator—you’re a product company.
2. Industry Rollup via Automation
Once your team is lean and scalable, use surplus margin to:
Acquire competitors
Lay off redundant ops
Keep top performers and client relationships
Standardize operations using your own automations
AI rollups will dominate fragmented industries—marketing, bookkeeping, operations, even law.
 This is your chance to consolidate, not get consolidated.
3. Build or Fine-Tune Your Own LLM
For some, the path involves going deeper:
Download open-source LLMs like DeepSeek
Fine-tune them with proprietary data
Deploy industry-specific intelligence engines
Host them on GPU clouds (e.g., rented NVIDIA chips)
This is how you build hyper-specialized AI moats no one else can replicate.
4. Sell and Reinvest
Sometimes, the smartest path forward is:
Packaging your automated business
Selling it at a peak multiple
Reinvesting into someone else’s AI vision
Starting a next-gen company from scratch
Freedom and clarity are byproducts of a well-optimized machine.
Transformation Toolkit
1. MTP Discovery Prompts
What would be impossible without AI that’s now possible?
What legacy industry would you love to rebuild from scratch?
What could you do with 100x capacity and zero new hires?
2. Disrupt-Yourself Simulator
 Roleplay:
“If I were my competitor, how would I use AI to destroy me?”
“If I started fresh today, what would I build instead?”
“What would my AI-powered 10-year roadmap look like?”
3. AI-Native Evolution Timeline
 We chart your path from:
AI-aware → AI-enabled → AI-native
 With key milestones at each phase to guide internal and external decisions.
Real-World Example: MyZone AI
We started as a marketing agency.
After automating ~60% of our operations, we saw the writing on the wall:
 90% of agencies likely won’t survive the next 5 years.
So we pivoted. We built MyZone AI:
A transformation framework
A platform of tools
A launchpad for new AI-powered service models
Our future-proofing moment was born out of proactive transformation.
Final Thought: This Is the Billion-Dollar Step
Steps 1–9 were about optimizing what exists.
Step 10 is about imagining what’s possible.
Transformation is no longer a one-time event—it’s a new way of thinking.
In the AI-first world, the winners will be those who:
Automate relentlessly
Invest intelligently
Think exponentially
Build before they’re forced to pivot
If you’ve made it this far, you’re already ahead.
Now let’s go finish what you started—and build the company your competitors can’t keep up with.
You’ve completed the MyZone AI Blueprint. Let’s go fly.
—
Conclusion: From Awareness to Transformatio
You’ve now reached the final page of the MyZone AI Blueprint—a journey that began with awareness and ends with reinvention.
Over the course of ten steps, you haven’t just explored how to use AI in your business—you’ve built a clear, proven path to becoming an AI-first organization. Whether you’re crawling, walking, running, or flying, you now have the structure, tools, and vision to scale your business into the future.
The Blueprint in Review
Wake Up – See where AI is now, where it's going, and why it matters (Step 1)
Get Ready – Assess your team and systems for AI readiness (Step 2)
Train Smart – Educate your people and build prompt fluency (Step 3)
Equip Well – Deploy the right tools for role-based performance (Step 4)
Think Bigger – Use AI as a strategic partner and competitive lens (Step 5)
Structure Data – Build a data backbone that feeds your future systems (Step 6)
Map the Machine – Make your operations visible and standardize processes (Step 7)
Prioritize Like a Pro – Focus energy on what’s valuable, fast, and achievable (Step 8)
Execute Efficiently – Build and launch automations with clear ownership (Step 9)
Transform Boldly – Reinvent your business model and shape your industry (Step 10)
Every step builds on the one before it, and together they form a repeatable system for scaling sustainably.
What Comes Next?
This isn’t the end of your AI journey—it’s just the beginning of your leadership journey.
Now is the time to:
Assign ownership for each stage internally
Launch your first automations
Build feedback loops across your teams
Track quarterly improvements in time, cost, accuracy, and team capability
And most importantly, evolve the Blueprint to fit your business. You are the test lab, the architect, and the pilot of your AI-powered growth curve.
Final Thought: Small Teams. Big Leverage.
The AI revolution won’t be won by the biggest companies.
It will be won by the boldest teams.
The small, systems-thinking companies who move fast, adapt well, and refuse to settle for incremental gains—they’re the ones who will win the next decade.
If you’ve made it through this Blueprint, you’re already among them.
So let’s get to work.
The future is not written. It’s designed.
Let’s build it—one system, one automation, one transformation at a time.
`;
  }
}
