import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, message: string, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Bad request (400) error factory
   */
  static badRequest(message: string, details?: any): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  /**
   * Unauthorized (401) error factory
   */
  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED', details);
  }

  /**
   * Forbidden (403) error factory
   */
  static forbidden(message: string = 'Forbidden', details?: any): ApiError {
    return new ApiError(403, message, 'FORBIDDEN', details);
  }

  /**
   * Not found (404) error factory
   */
  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(404, message, 'NOT_FOUND', details);
  }

  /**
   * Conflict (409) error factory
   */
  static conflict(message: string, details?: any): ApiError {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  /**
   * Server error (500) factory
   */
  static serverError(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(500, message, 'SERVER_ERROR', details);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Default to 500 server error
  console.error('[Server Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    }
  });
}