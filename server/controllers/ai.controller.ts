import { Request, Response } from "express";
import OpenAI from "openai";

// Define interface for category in request
interface Category {
  name: string;
  score: number;
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
      const { assessmentTitle, book, categories, userEmail } = req.body as AIRequestBody;
      
      // Validate request
      if (!assessmentTitle || !book || !categories || !categories.length) {
        return res.status(400).json({
          success: false,
          error: "Invalid request. Missing required fields."
        });
      }
      
      // Check if OpenAI API key is set
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key not set");
        return res.status(500).json({
          success: false,
          error: "OpenAI API key not configured"
        });
      }
      
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Prepare system prompt
      const systemPrompt = `You are a business transformation advisor trained on the book "${book}".
Provide one actionable recommendation per category based on a numerical score (1–10).
Assume the lower the score, the more improvement is needed.
Output markdown-formatted content with ## headings for each category.
Be direct and strategic with specific actionable recommendations.`;
      
      // Create user payload as JSON string
      const userPayload = JSON.stringify({
        assessmentTitle,
        book,
        categories,
        ...(userEmail && { userEmail })
      });

      // Make API request to OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      // Get the response content
      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        return res.status(500).json({
          success: false,
          error: "No content returned from AI"
        });
      }
      
      // Return the AI-generated content
      return res.status(200).json({
        success: true,
        content
      });
      
    } catch (error: any) {
      console.error("Error generating AI suggestions:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI suggestions"
      });
    }
  }
}