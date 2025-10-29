import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { AssessmentService } from "../services/assessment.service";
import { UserService } from "../services/user.service";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors";

export class AssessmentController {
  static async getAll(req: Request, res: Response) {
    try {
      // Parse parameters using service
      const params = AssessmentService.parsePaginationParams(req);

      const result = await AssessmentService.getAssessmentsForUser(req.user!.id, {
        page: params.page,
        pageSize: params.pageSize,
        limit: params.pageSize,
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      // Use standardized paginated response format
      return ApiResponse.paginated(
        res,
        result.data,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
      );
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to fetch assessments");
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return ApiResponse.validationError(res, 
          { assessmentId: "Invalid assessment ID" }, 
          "Invalid assessment ID"
        );
      }

      // Get user role for access control
      const user = await UserService.getById(req.user!.id);
      const userRole = user?.role;

      const assessment = await AssessmentService.getAssessmentByIdForUser(
        assessmentId, 
        req.user!.id, 
        userRole || undefined
      );
      return ApiResponse.success(res, { assessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Assessment");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to fetch assessment");
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { surveyTemplateId } = req.body;

      // Validation handled by middleware

      const assessmentData = {
        surveyTemplateId: parseInt(surveyTemplateId),
        userId: req.user!.id,
      };

      const newAssessment = await AssessmentService.createAssessment(assessmentData, req.user!.id);
      return ApiResponse.success(res, { assessment: newAssessment }, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message);
      }
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Survey template not found");
      }
      return ApiResponse.internalError(res, error.message || "Failed to create assessment");
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return ApiResponse.validationError(res,
          { assessmentId: "Invalid assessment ID" },
          "Invalid assessment ID"
        );
      }

      // req.body is already validated by middleware
      const updateData = {
        ...req.body,
      };

      const updatedAssessment = await AssessmentService.updateAssessment(
        assessmentId,
        updateData,
        req.user!.id,
        false // isAdmin - could be enhanced to check user role
      );

      return ApiResponse.success(res, { assessment: updatedAssessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Assessment");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to update assessment");
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return ApiResponse.validationError(res, "Invalid assessment ID");
      }

      const deleted = await AssessmentService.deleteAssessment(assessmentId, req.user!.id);

      if (!deleted) {
        return ApiResponse.internalError(res, "Failed to delete assessment");
      }

      return ApiResponse.success(res, { message: "Assessment deleted successfully" });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Assessment not found");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to delete assessment");
    }
  }

  static async createGuest(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const { surveyId, guestData, answers, status } = req.body;

      const assessmentData = {
        surveyTemplateId: surveyId,
        guestData,
        answers,
        status: status || "completed",
      };

      const assessment = await AssessmentService.createGuestAssessment(assessmentData);
      return ApiResponse.success(res, { assessment }, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message);
      }
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Survey template not found");
      }
      return ApiResponse.internalError(res, error.message || "Failed to create guest assessment");
    }
  }

  static async getGuestById(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      
      const assessment = await AssessmentService.getAssessmentById(assessmentId);
      
      // Verify this is a guest assessment
      if (assessment.userId !== null) {
        return ApiResponse.forbidden(res, "This endpoint can only be used for guest assessments");
      }

      return ApiResponse.success(res, { assessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Assessment not found");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to fetch guest assessment");
    }
  }

  static async updateGuest(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      // req.body is already validated by middleware
      const { recommendations } = req.body;

      const updatedAssessment = await AssessmentService.updateGuestAssessment(
        assessmentId,
        recommendations
      );

      return ApiResponse.success(res, { assessment: updatedAssessment });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Assessment not found");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to update guest assessment");
    }
  }
}