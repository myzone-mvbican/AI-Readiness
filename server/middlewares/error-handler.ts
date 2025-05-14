import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error handler middleware
 * This should be placed after all routes to catch any undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global error handler middleware
 * This catches all errors thrown in route handlers
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);
  
  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors
    });
    return;
  }
  
  // Handle custom API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }
  
  // Handle unexpected errors
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'development'
    ? err.message || 'Internal server error'
    : 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message
  });
}