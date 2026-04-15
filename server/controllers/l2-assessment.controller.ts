import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { L2AssessmentService } from "../services/l2-assessment.service";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors";

export class L2AssessmentController {
  /**
   * POST /api/l2/assessments — Save a completed L2 department assessment
   */
  static async save(req: Request, res: Response) {
    try {
      const assessment = await L2AssessmentService.save(req.user!.id, req.body);
      return ApiResponse.success(res, { assessment }, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, {}, error.message);
      }
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l2/assessments — Get all L2 assessments for current user/org
   */
  static async getAll(req: Request, res: Response) {
    try {
      const assessments = await L2AssessmentService.getByUserId(req.user!.id);
      return ApiResponse.success(res, { assessments });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l2/assessments/:id — Get specific L2 assessment
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return ApiResponse.validationError(res, { id: "Invalid ID" });

      const assessment = await L2AssessmentService.getById(id, req.user!.id);
      return ApiResponse.success(res, { assessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "L2 Assessment");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l2/summary — Aggregated L2 scores (latest per department)
   */
  static async getSummary(req: Request, res: Response) {
    try {
      // Need orgId — get from user's membership
      const { OrgRepository } = await import("../repositories/org.repository");
      const orgRepo = new OrgRepository();
      const orgResult = await orgRepo.getByUserId(req.user!.id);
      if (!orgResult) {
        return ApiResponse.success(res, { summary: [], avgScore: null });
      }

      const summary = await L2AssessmentService.getSummary(orgResult.org.id);
      const avgScore = summary.length > 0
        ? summary.reduce((sum, a) => sum + (a.overallScore || 0), 0) / summary.length
        : null;

      return ApiResponse.success(res, {
        summary: summary.map(a => ({
          id: a.id,
          department: a.department,
          overallScore: a.overallScore,
          maturityStage: a.maturityStage,
          categoryScores: a.categoryScores,
          completedAt: a.completedAt,
        })),
        avgScore,
      });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }
}
