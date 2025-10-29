import { Request, Response } from "express";
import { BenchmarkService } from "../services/benchmark.service";
import { ApiResponse } from "../utils/apiResponse";

export class BenchmarkController {
  /**
   * Get benchmark comparison data for a specific assessment
   * GET /api/assessments/:id/benchmark
   */
  static async getBenchmark(req: Request, res: Response) {
    try {
      // Validate assessment ID using service
      const { validId: id, error } = BenchmarkService.validateAssessmentId(req.params.id);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const benchmarkData = await BenchmarkService.getBenchmarkData(id);

      if (!benchmarkData) {
        // Check if assessment exists to provide more specific error
        const { AssessmentService } = await import("../services/assessment.service");
        const assessment = await AssessmentService.getAssessmentById(id);
        
        if (!assessment) {
          return ApiResponse.notFound(res, "Assessment not found");
        }
        
        if (!assessment.completedOn) {
          return ApiResponse.notFound(res, "Assessment not completed yet - benchmark data unavailable");
        }
        
        // Check if user has industry data
        const industry = BenchmarkService.getUserIndustry(assessment, req.user);
        if (!industry) {
          return ApiResponse.notFound(res, "No industry data available for benchmarking - please update your profile");
        }
        
        return ApiResponse.notFound(res, "No benchmark data available for your industry at this time");
      }

      return ApiResponse.success(res, benchmarkData);
    } catch (error) {
      console.error("Benchmark controller error:", error);
      return ApiResponse.internalError(res, "Failed to retrieve benchmark data");
    }
  }

  /**
   * Trigger manual recalculation of survey statistics
   * POST /api/admin/benchmark/recalculate
   * (Admin only - for testing and manual updates)
   */
  static async recalculateStats(req: Request, res: Response) {
    try {
      await BenchmarkService.recalculateSurveyStats();

      return ApiResponse.success(res, { message: "Survey statistics recalculated successfully" });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to recalculate survey statistics");
    }
  }
}
