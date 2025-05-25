import { Request, Response } from "express";
import { BenchmarkService } from "../services/benchmark.service";

export class BenchmarkController {
  /**
   * Get benchmark comparison data for a specific assessment
   * GET /api/assessments/:id/benchmark
   */
  static async getBenchmark(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID",
        });
      }

      const benchmarkData = await BenchmarkService.getBenchmarkData(id);

      if (!benchmarkData) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found or no benchmark data available",
        });
      }

      return res.status(200).json({
        success: true,
        data: benchmarkData,
      });
    } catch (error) {
      console.error("Error getting benchmark data:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve benchmark data",
      });
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

      return res.status(200).json({
        success: true,
        message: "Survey statistics recalculated successfully",
      });
    } catch (error) {
      console.error("Error recalculating survey statistics:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to recalculate survey statistics",
      });
    }
  }
}
