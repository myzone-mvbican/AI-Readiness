import { Request, Response } from "express";
import { Assessment } from "@shared/types";
import { ApiResponse } from "../utils/apiResponse";
import { AIService } from "../services/ai.service";

// Define interface for request body
interface AIRequestBody {
  assessment: Assessment;
}

export class AIController {
  static async analyzeIndustry(req: Request, res: Response) {
    try {
      // Validation handled by middleware
      const { url } = req.body;
      const userId = req.user?.id;
      const result = await AIService.analyzeIndustry(url, userId);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to analyze website industry");
    }
  }

  static async generateSuggestions(req: Request, res: Response) {
    try {
      const { assessment } = req.body as AIRequestBody;
      const userId = req.user?.id;
      const result = await AIService.generateSuggestions(assessment, userId);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to generate AI suggestions");
    }
  }
}