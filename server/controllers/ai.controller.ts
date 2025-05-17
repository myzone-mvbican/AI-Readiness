import { Request, Response } from "express";
import OpenAI from "openai";

// Define interface for category in request
interface Category {
  name: string;
  score: number;
  previousScore: number | null;
  benchmark: number | null;
}

// Define interface for request body
interface AIRequestBody {
  assessmentTitle: string;
  book: string;
  categories: Category[];
  userEmail?: string;
}

export class AIController {
  static async generateSuggestions(req: Request, res: Response) {
    try {
      const { assessmentTitle, book, categories, userEmail } =
        req.body as AIRequestBody;

      // Validate request
      if (!assessmentTitle || !book || !categories || !categories.length) {
        return res.status(400).json({
          success: false,
          error: "Invalid request. Missing required fields.",
        });
      }

      // Check if OpenAI API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key not set");
        return res.status(500).json({
          success: false,
          error: "OpenAI API key not configured",
        });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Prepare system prompt
      let systemPrompt = `You are an expert AI Readiness Analyst.  
Given the user input, generate a concise, engaging, and actionable report.
Produce a Markdown report structured as follows:

`;

      // Append each category to systemPrompt as comment
      categories.forEach((category) => {
        systemPrompt += `## {{emoji}} ${category.name}

*Generate a 3–5-sentence summary by synthesizing the relevant section from the ${book}.*

**How You Performed**

* Current Score: **${category.score} / 10 (${((category.score / 10) * 100).toFixed(0)}%)**

`;

        if (category.benchmark != null) {
          systemPrompt += `* Benchmark: **${category.benchmark ? `${((category.benchmark / 10) * 100).toFixed(0)}%` : "N/A"}**`;
        }

        if (category.previousScore != null) {
          const delta = category.score - category.previousScore;
          systemPrompt += `* Trend vs. Previous: **${delta > 0 ? "⬆ Up by" : delta < 0 ? "⬇ Down by" : "→ No change"} ${Math.abs(delta)}** points  \n`;
        } else {
          systemPrompt += `* Trend vs. Previous: **First-time assessment**`;
        }

        systemPrompt += `** {{emoji.keys}} Key Best Practices** _(top 3)_`;
        for (let i = 1; i <= 3; i++) {
          systemPrompt += `1. …`;
        }
      });

      systemPrompt += `
## 🪨 Top 5 AI Rocks for Next Quarter

Here are your **highest-impact, easiest-to-implement AI rocks** for the next 90 days

_From the list of all Category Best Practices, choose the 5 highest-impact, easiest to implement "rocks." For each:_
1. **{{rock.title}}**  
   _Rationale:_ {{rock.rationale}}

…until you list five.

Ensure:  
- EOS-style language for each rock ("Your #1 priority this quarter is…").  
- Bulleted Markdown, ready for PDF conversion.  
- If any 'benchmark' or 'previousScore' is null, omit that line.  
- Keep each Best Practice bullet ≤ 20 words, and rationales ≤ 30 words.`;

      // Create user payload as JSON string
      const userPayload = JSON.stringify({
        assessmentTitle,
        categories,
        ...(userEmail && { userEmail }),
      });

      // Make API request to OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      // Get the response content
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        return res.status(500).json({
          success: false,
          error: "No content returned from AI",
        });
      }

      // Return the AI-generated content
      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      console.error("Error generating AI suggestions:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI suggestions",
      });
    }
  }
}
