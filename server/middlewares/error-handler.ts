import { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class with status code and message
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  // Default status code and message for internal server errors
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from Zod)
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    // Handle auth errors
    statusCode = 401;
    message = 'Unauthorized';
  }
  
  res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    // Include stack trace in development, but not in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

/**
 * Not found handler middleware for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
}