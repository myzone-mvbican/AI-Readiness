import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { SurveyService } from "../services/survey.service";
import { ValidationError, NotFoundError, ForbiddenError, InternalServerError } from "../utils/errors";

export class SurveyController {
  static async getAll(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return ApiResponse.validationError(res, 
          { teamId: "Invalid team ID" }, 
          "Invalid team ID"
        );
      }

      // Extract query parameters for server-side filtering, sorting, and pagination
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || null;
      const sortBy = (req.query.sortBy as string) || "updatedAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const result = await SurveyService.getSurveysForTeam(teamId, {
        page,
        pageSize,
        limit: pageSize,
        search,
        status: status || undefined,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      // Use standardized paginated response format
      return ApiResponse.paginated(
        res,
        result.data,
        page,
        pageSize,
        result.pagination.total
      );
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to retrieve surveys");
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return ApiResponse.validationError(res, 
          { surveyId: "Invalid survey ID" }, 
          "Invalid survey ID"
        );
      }

      const survey = await SurveyService.getById(surveyId);
      if (!survey) {
        return ApiResponse.notFound(res, "Survey");
      }
      return ApiResponse.success(res, { survey });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to retrieve survey");
    }
  }

  static async create(req: Request, res: Response) {
    try {
      // File validation handled by middleware

      // Parse and transform data using service
      const { data: surveyData, error } = SurveyService.parseSurveyCreationData(req);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const newSurvey = await SurveyService.createSurvey(surveyData, req.file!.path);
      return ApiResponse.success(res, { survey: newSurvey }, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to create survey");
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        if (req.file) {
          SurveyService.cleanupFile(req.file.path);
        }
        return ApiResponse.validationError(res, 
          { surveyId: "Invalid survey ID" }, 
          "Invalid survey ID"
        );
      }

      // req.body is already validated by middleware
      // Prepare update data
      const updateData: any = {};

      // Update title if provided
      if (req.body.title) {
        updateData.title = req.body.title;
      }

      // Update status if provided
      if (req.body.status) {
        updateData.status = req.body.status;
      }

      // Update completion limit if provided
      if (req.body.completionLimit !== undefined) {
        updateData.completionLimit = req.body.completionLimit;
      }

      // Process team selection
      if (req.body.teamIds !== undefined) {
        updateData.teamIds = req.body.teamIds;
      }

      // Handle file update
      if (req.file) {
        // Update questions count if provided
        if (req.body.questionsCount) {
          updateData.questionsCount = req.body.questionsCount;
        }
      }

      const updatedSurvey = await SurveyService.updateSurvey(
        surveyId,
        updateData,
        req.user!.id,
        req.file?.path
      );

      return ApiResponse.success(res, { survey: updatedSurvey });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Survey");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to update survey");
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return ApiResponse.validationError(res, 
          { surveyId: "Invalid survey ID" }, 
          "Invalid survey ID"
        );
      }

      const deleted = await SurveyService.deleteSurvey(surveyId, req.user!.id);

      if (!deleted) {
        return ApiResponse.internalError(res, "Failed to delete survey");
      }

      return ApiResponse.success(res, { message: "Survey deleted successfully" });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Survey");
      }
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      return ApiResponse.internalError(res, error.message || "Failed to delete survey");
    }
  }

  static async getTeams(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return ApiResponse.validationError(res, 
          { surveyId: "Invalid survey ID" }, 
          "Invalid survey ID"
        );
      }

      const teamIds = await SurveyService.getSurveyTeams(surveyId);
      return ApiResponse.success(res, { teamIds });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, "Survey");
      }
      return ApiResponse.internalError(res, error.message || "Failed to retrieve teams for survey");
    }
  }

  /**
   * Check if user can take a survey based on completion limits
   */
  static async checkCompletionEligibility(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.surveyId);
      if (isNaN(surveyId)) {
        return ApiResponse.validationError(res, 
          { surveyId: "Invalid survey ID" }, 
          "Invalid survey ID"
        );
      }

      const userId = req.user?.id;
      const guestEmail = req.body.guestEmail;

      const result = await SurveyService.checkCompletionEligibility(surveyId, userId, guestEmail);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to check completion eligibility");
    }
  }

  /**
   * Get completion status for all surveys that the user can see
   */
  static async getCompletionStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.unauthorized(res, "User not authenticated");
      }

      const completionStatus = await SurveyService.getCompletionStatus(userId);
      return ApiResponse.success(res, { completionStatus });
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to get completion status");
    }
  }

  /**
   * Get all surveys for assessment modal
   */
  static async getAllForAssessment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.unauthorized(res, "User not authenticated");
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || "";
      const sortBy = (req.query.sortBy as string) || "updatedAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const result = await SurveyService.getAllSurveysForAssessment({
        page,
        pageSize,
        limit: pageSize,
        search,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      return ApiResponse.paginated(
        res,
        result.data,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
      );
    } catch (error: any) {
      return ApiResponse.internalError(res, error.message || "Failed to get surveys for assessment");
    }
  }
}