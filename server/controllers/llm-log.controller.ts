import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { LLMLogService } from "../services/llm-log.service";
import { InternalServerError } from "../utils/errors";

export class LLMLogController {
  /**
   * Create a new LLM log entry
   * POST /api/logs/llm
   */
  static async create(req: Request, res: Response) {
    try {
      const logId = await LLMLogService.createLog({
        userId: req.user?.id,
        organizationId: undefined, // Future: get from req.user or req.organization
        environment: req.body.environment || process.env.NODE_ENV || "development",
        route: req.body.route,
        featureName: req.body.featureName,
        provider: req.body.provider,
        model: req.body.model,
        endpoint: req.body.endpoint,
        request: req.body.request,
        response: req.body.response,
        metrics: req.body.metrics,
        retries: req.body.retries,
        security: req.body.security,
        redactionStatus: req.body.redactionStatus,
        debug: req.body.debug,
        stableTrace: req.body.stableTrace,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
      });

      return ApiResponse.success(res, { id: logId }, 201);
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to create LLM log entry");
    }
  }

  /**
   * Get logs with filters and pagination
   * GET /api/logs/llm
   */
  static async getLogs(req: Request, res: Response) {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const sortBy = (req.query.sortBy as string) || "timestamp";
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      // Build filters
      const filters: any = {
        includeDeleted: req.query.includeDeleted === "true",
      };

      // User filtering - users can only see their own logs unless admin
      if (req.user?.role !== "admin" && req.user?.id) {
        filters.userId = req.user.id;
      } else if (req.query.userId) {
        filters.userId = parseInt(req.query.userId as string);
      }

      if (req.query.organizationId) {
        filters.organizationId = parseInt(req.query.organizationId as string);
      }

      if (req.query.provider) {
        filters.provider = req.query.provider as string;
      }

      if (req.query.model) {
        filters.model = req.query.model as string;
      }

      if (req.query.environment) {
        filters.environment = req.query.environment as string;
      }

      if (req.query.route) {
        filters.route = req.query.route as string;
      }

      if (req.query.featureName) {
        filters.featureName = req.query.featureName as string;
      }

      if (req.query.status) {
        filters.status = req.query.status as "success" | "error";
      }

      if (req.query.startTime) {
        filters.startTime = new Date(req.query.startTime as string);
      }

      if (req.query.endTime) {
        filters.endTime = new Date(req.query.endTime as string);
      }

      const result = await LLMLogService.getLogs({
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      });

      return ApiResponse.paginated(
        res,
        result.data,
        page,
        limit,
        result.pagination.total
      );
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to retrieve LLM logs");
    }
  }

  /**
   * Get a specific log by ID
   * GET /api/logs/llm/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const logId = parseInt(req.params.id);
      if (isNaN(logId)) {
        return ApiResponse.validationError(
          res,
          { id: "Invalid log ID" },
          "Invalid log ID"
        );
      }

      const log = await LLMLogService.getLogById(logId);
      if (!log) {
        return ApiResponse.notFound(res, "LLM log");
      }

      // Check authorization - users can only see their own logs unless admin
      if (req.user?.role !== "admin" && log.userId !== req.user?.id) {
        return ApiResponse.forbidden(res, "You don't have access to this log");
      }

      return ApiResponse.success(res, { log });
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to retrieve LLM log");
    }
  }
}

