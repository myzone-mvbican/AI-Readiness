/**
 * Standardized API Response Utilities
 * 
 * This utility class provides consistent response formatting across all API endpoints.
 * Uses the new standardized format (Option 4 - Strict Discriminated Union).
 */

import { Response } from "express";
import { ErrorCodes, ErrorCode, PaginationMetadata } from "@shared/types/api-standard";

export class ApiResponse {
  /**
   * Send a successful response with data
   * 
   * @param res - Express response object
   * @param data - The data to return
   * @param statusCode - HTTP status code (default: 200)
   * @returns Express response
   */
  static success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send a successful response with metadata
   * 
   * @param res - Express response object
   * @param data - The data to return
   * @param metadata - Metadata (pagination, requestId, etc.)
   * @param statusCode - HTTP status code (default: 200)
   * @returns Express response
   */
  static successWithMeta<T>(
    res: Response,
    data: T,
    metadata: {
      pagination?: PaginationMetadata;
      requestId?: string;
      timestamp?: string;
    },
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      data,
      metadata,
    });
  }

  /**
   * Send a paginated response
   * 
   * @param res - Express response object
   * @param data - Array of items
   * @param page - Current page number (1-indexed)
   * @param pageSize - Number of items per page
   * @param totalItems - Total number of items across all pages
   * @returns Express response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    pageSize: number,
    totalItems: number
  ) {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return res.status(200).json({
      success: true,
      data,
      metadata: {
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  }

  /**
   * Send an error response
   * 
   * @param res - Express response object
   * @param code - Error code (use ErrorCodes constants)
   * @param message - User-friendly error message
   * @param statusCode - HTTP status code (default: 500)
   * @param details - Additional error details (optional)
   * @returns Express response
   */
  static error(
    res: Response,
    code: ErrorCode | string,
    message: string,
    statusCode = 500,
    details?: any
  ) {
    const errorResponse: any = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details !== undefined) {
      errorResponse.error.details = details;
    }

    return res.status(statusCode).json(errorResponse);
  }

  /**
   * Send a 404 Not Found error
   * 
   * @param res - Express response object
   * @param resource - Name of the resource that wasn't found (default: "Resource")
   * @returns Express response
   */
  static notFound(res: Response, resource = "Resource") {
    return this.error(
      res,
      ErrorCodes.NOT_FOUND,
      `${resource} not found`,
      404
    );
  }

  /**
   * Send a 400 Validation Error
   * 
   * @param res - Express response object
   * @param details - Validation error details (field-level errors)
   * @param message - Custom error message (default: "Invalid input data")
   * @returns Express response
   */
  static validationError(res: Response, details: any, message = "Invalid input data") {
    return this.error(
      res,
      ErrorCodes.VALIDATION_ERROR,
      message,
      400,
      details
    );
  }

  /**
   * Send a 401 Unauthorized error
   * 
   * @param res - Express response object
   * @param message - Custom error message (default: "Unauthorized")
   * @returns Express response
   */
  static unauthorized(res: Response, message = "Unauthorized") {
    return this.error(
      res,
      ErrorCodes.UNAUTHORIZED,
      message,
      401
    );
  }

  /**
   * Send a 403 Forbidden error
   * 
   * @param res - Express response object
   * @param message - Custom error message (default: "Access forbidden")
   * @returns Express response
   */
  static forbidden(res: Response, message = "Access forbidden") {
    return this.error(
      res,
      ErrorCodes.FORBIDDEN,
      message,
      403
    );
  }

  /**
   * Send a 409 Conflict error
   * 
   * @param res - Express response object
   * @param message - Error message describing the conflict
   * @returns Express response
   */
  static conflict(res: Response, message: string) {
    return this.error(
      res,
      ErrorCodes.CONFLICT,
      message,
      409
    );
  }

  /**
   * Send a 500 Internal Server Error
   * 
   * @param res - Express response object
   * @param message - Error message (default: "Internal server error")
   * @returns Express response
   */
  static internalError(res: Response, message = "Internal server error") {
    return this.error(
      res,
      ErrorCodes.INTERNAL_ERROR,
      message,
      500
    );
  }
}

