/**
 * API Response Utilities
 * 
 * Provides backward-compatible response helpers that can be gradually
 * adopted across existing endpoints without breaking functionality.
 */

import { Response } from "express";
import { createApiResponse, ApiResponse, LegacyApiResponse } from "@shared/types/api";

/**
 * Enhanced response utilities that maintain compatibility with existing API structure
 */
export class ApiResponseUtil {
  /**
   * Send a success response with standardized format
   * Falls back to legacy format if needed for compatibility
   */
  static success<T>(
    res: Response, 
    data: T, 
    message?: string, 
    statusCode: number = 200
  ): Response {
    // For now, maintain existing response structure while adding metadata
    const response = {
      success: true,
      ...(data && { data }),
      ...(message && { message }),
      // Add timestamp for debugging and monitoring
      _meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response with consistent format
   */
  static error(
    res: Response, 
    message: string, 
    statusCode: number = 400,
    details?: Record<string, any>
  ): Response {
    const response = {
      success: false,
      message,
      ...(details && { details }),
      _meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send a validation error response
   */
  static validationError(
    res: Response, 
    errors: Record<string, string[]>,
    message: string = "Validation failed"
  ): Response {
    return this.error(res, message, 422, { validationErrors: errors });
  }

  /**
   * Send an authentication error
   */
  static unauthorized(res: Response, message: string = "Unauthorized"): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send a not found error
   */
  static notFound(res: Response, message: string = "Resource not found"): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send a server error response
   */
  static serverError(res: Response, message: string = "Internal server error"): Response {
    return this.error(res, message, 500);
  }

  /**
   * Legacy compatibility wrapper - maintains exact existing response format
   * This allows gradual migration without breaking existing frontend code
   */
  static legacy = {
    // Authentication responses (matches current format exactly)
    authSuccess: (res: Response, user: any, token: string, message: string) => 
      res.json({ success: true, user, token, message }),

    authError: (res: Response, message: string) => 
      res.status(400).json({ success: false, message }),

    // Assessment responses (matches current format exactly)
    assessmentSuccess: (res: Response, assessment: any, message?: string) => 
      res.json({ success: true, assessment, ...(message && { message }) }),

    assessmentsSuccess: (res: Response, assessments: any[]) => 
      res.json({ success: true, assessments }),

    // Team responses (matches current format exactly)
    teamsSuccess: (res: Response, teams: any[]) => 
      res.json({ success: true, teams }),

    // Survey responses (matches current format exactly)
    surveysSuccess: (res: Response, surveys: any[]) => 
      res.json({ success: true, surveys }),

    surveySuccess: (res: Response, survey: any, message?: string) => 
      res.json({ success: true, survey, ...(message && { message }) }),

    // Generic success with data field (new endpoints)
    dataSuccess: (res: Response, data: any, message?: string) => 
      res.json({ success: true, data, ...(message && { message }) }),

    // Error response (matches current format)
    error: (res: Response, message: string, statusCode: number = 400) => 
      res.status(statusCode).json({ success: false, message })
  };
}

/**
 * Middleware to add response utilities to Express Response object
 */
export function addResponseUtils(req: any, res: any, next: any) {
  // Add utility methods directly to response object for convenience
  res.apiSuccess = (data: any, message?: string, statusCode?: number) => 
    ApiResponseUtil.success(res, data, message, statusCode);

  res.apiError = (message: string, statusCode?: number, details?: any) => 
    ApiResponseUtil.error(res, message, statusCode, details);

  res.apiValidationError = (errors: Record<string, string[]>, message?: string) => 
    ApiResponseUtil.validationError(res, errors, message);

  res.apiUnauthorized = (message?: string) => 
    ApiResponseUtil.unauthorized(res, message);

  res.apiNotFound = (message?: string) => 
    ApiResponseUtil.notFound(res, message);

  res.apiServerError = (message?: string) => 
    ApiResponseUtil.serverError(res, message);

  next();
}

// Type augmentation for Express Response
declare global {
  namespace Express {
    interface Response {
      apiSuccess<T>(data: T, message?: string, statusCode?: number): Response;
      apiError(message: string, statusCode?: number, details?: any): Response;
      apiValidationError(errors: Record<string, string[]>, message?: string): Response;
      apiUnauthorized(message?: string): Response;
      apiNotFound(message?: string): Response;
      apiServerError(message?: string): Response;
    }
  }
}