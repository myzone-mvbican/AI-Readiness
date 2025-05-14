import { Request, Response, NextFunction } from 'express';

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: any): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string, details?: any): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string, details?: any): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string, details?: any): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND', details);
  }

  static internal(message: string, details?: any): ApiError {
    return new ApiError(message, 500, 'SERVER_ERROR', details);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error | ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.error('Error:', err);

  // Default error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: 'An unexpected error occurred',
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Unknown error',
    }
  };

  // Handle specific API errors
  if (err instanceof ApiError) {
    errorResponse.message = err.message;
    errorResponse.error = {
      code: err.code,
      message: err.message,
    };

    if (err.details) {
      errorResponse.error.details = err.details;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle other types of errors
  if (err instanceof SyntaxError && 'body' in err) {
    // Handle JSON parsing errors
    errorResponse.error.code = 'BAD_REQUEST';
    errorResponse.message = 'Invalid JSON payload';
    return res.status(400).json(errorResponse);
  }

  // Default to 500 internal server error
  res.status(500).json(errorResponse);
}

/**
 * Not found middleware for handling undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  const errorResponse: ErrorResponse = {
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist'
    }
  };

  res.status(404).json(errorResponse);
}