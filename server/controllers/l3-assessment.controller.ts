import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { L3AssessmentService } from "../services/l3-assessment.service";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors";

export class L3AssessmentController {
  /**
   * POST /api/l3/assessments — Save a completed L3 personal assessment
   */
  static async save(req: Request, res: Response) {
    try {
      const assessment = await L3AssessmentService.save(req.user!.id, req.body);
      return ApiResponse.success(res, { assessment }, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, {}, error.message);
      }
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l3/assessments — Get all L3 assessments for current user
   */
  static async getAll(req: Request, res: Response) {
    try {
      const assessments = await L3AssessmentService.getByUserId(req.user!.id);
      return ApiResponse.success(res, { assessments });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l3/assessments/:id — Get specific L3 assessment
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return ApiResponse.validationError(res, { id: "Invalid ID" });

      const assessment = await L3AssessmentService.getById(id, req.user!.id);
      return ApiResponse.success(res, { assessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) return ApiResponse.notFound(res, "L3 Assessment");
      if (error instanceof ForbiddenError) return ApiResponse.forbidden(res, error.message);
      return ApiResponse.internalError(res, error.message);
    }
  }

  /**
   * GET /api/l3/team-summary — Aggregated L3 scores (latest per team member)
   */
  static async getTeamSummary(req: Request, res: Response) {
    try {
      const { OrgRepository } = await import("../repositories/org.repository");
      const orgRepo = new OrgRepository();
      const orgResult = await orgRepo.getByUserId(req.user!.id);
      if (!orgResult) {
        return ApiResponse.success(res, { teamSummary: [], avgScore: null });
      }

      const teamSummary = await L3AssessmentService.getTeamSummary(orgResult.org.id);
      const avgScore = teamSummary.length > 0
        ? teamSummary.reduce((sum, a) => sum + (a.overallScore || 0), 0) / teamSummary.length
        : null;

      return ApiResponse.success(res, {
        teamSummary: teamSummary.map(a => ({
          id: a.id,
          userId: a.userId,
          name: a.name,
          department: a.department,
          overallScore: a.overallScore,
          maturityStage: a.maturityStage,
          dimensionScores: a.dimensionScores,
          completedAt: a.completedAt,
        })),
        avgScore,
      });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message);
    }
  }
}
