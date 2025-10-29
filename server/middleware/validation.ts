/**
 * Validation Middleware
 * 
 * Provides centralized validation using Zod schemas
 * Replaces manual validation logic in controllers
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils/apiResponse";

/**
 * Generic validation middleware for request body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        
        const errors = result.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        
        return ApiResponse.validationError(res, errors, "Validation failed");
      }
      
      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return ApiResponse.internalError(res, "Validation error");
    }
  };
}

/**
 * Generic validation middleware for query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        
        return ApiResponse.validationError(res, errors, "Query validation failed");
      }
      
      // Replace req.query with validated data
      req.query = result.data;
      next();
    } catch (error) {
      return ApiResponse.internalError(res, "Query validation error");
    }
  };
}

/**
 * Generic validation middleware for URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        
        return ApiResponse.validationError(res, errors, "Parameter validation failed");
      }
      
      // Replace req.params with validated data
      req.params = result.data;
      next();
    } catch (error) {
      return ApiResponse.internalError(res, "Parameter validation error");
    }
  };
}

/**
 * Custom validation for survey creation with file upload
 */
export function validateSurveyCreation(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return ApiResponse.validationError(res, 
        { file: "CSV file is required" }, 
        "CSV file is required"
      );
    }

    // Validate required fields
    const { title, questionsCount } = req.body;
    
    if (!title) {
      return ApiResponse.validationError(res, 
        { title: "Title is required" }, 
        "Title is required"
      );
    }
    
    if (!questionsCount) {
      return ApiResponse.validationError(res, 
        { questionsCount: "Questions count is required" }, 
        "Questions count is required"
      );
    }

    // Validate questions count is a number
    const questionsCountNum = parseInt(questionsCount);
    if (isNaN(questionsCountNum) || questionsCountNum < 1) {
      return ApiResponse.validationError(res, 
        { questionsCount: "Questions count must be a positive number" }, 
        "Questions count must be a positive number"
      );
    }

    // Validate teamId if provided
    if (req.body.teamId) {
      const teamIdNum = parseInt(req.body.teamId);
      if (isNaN(teamIdNum)) {
        return ApiResponse.validationError(res, 
          { teamId: "Invalid team ID format. Must be a valid number or empty for global surveys." },
          "Invalid team ID format. Must be a valid number or empty for global surveys."
        );
      }
    }

    // Validate completion limit if provided
    if (req.body.completionLimit !== undefined && req.body.completionLimit !== "") {
      const completionLimitNum = parseInt(req.body.completionLimit);
      if (isNaN(completionLimitNum) || completionLimitNum < 1) {
        return ApiResponse.validationError(res, 
          { completionLimit: "Completion limit must be a positive number" },
          "Completion limit must be a positive number"
        );
      }
    }

    // Process teamIds if provided
    if (req.body.teamIds !== undefined) {
      try {
        const teamIds = JSON.parse(req.body.teamIds);
        if (!Array.isArray(teamIds)) {
          return ApiResponse.validationError(res, 
            { teamIds: "teamIds must be an array" },
            "teamIds must be an array"
          );
        }
        // Allow empty array for global surveys
        if (teamIds.length > 0 && !teamIds.every(id => typeof id === 'number' && id > 0)) {
          return ApiResponse.validationError(res, 
            { teamIds: "teamIds must be an array of positive numbers" },
            "teamIds must be an array of positive numbers"
          );
        }
      } catch (error) {
        return ApiResponse.validationError(res, 
          { teamIds: "Invalid teamIds format" },
          "Invalid teamIds format"
        );
      }
    }

    next();
  } catch (error) {
    return ApiResponse.internalError(res, "Survey validation error");
  }
}

/**
 * Validation for URL analysis
 */
export function validateUrlAnalysis(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return ApiResponse.validationError(res, 
        { url: "URL is required" }, 
        "URL is required"
      );
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return ApiResponse.validationError(res, 
          { url: "URL must use HTTP or HTTPS protocol" },
          "URL must use HTTP or HTTPS protocol"
        );
      }
    } catch (error) {
      return ApiResponse.validationError(res, 
        { url: "Please enter a valid URL" },
        "Please enter a valid URL"
      );
    }

    next();
  } catch (error) {
    return ApiResponse.internalError(res, "URL validation error");
  }
}

