import type { Request, Response, NextFunction } from 'express';
import { env } from 'server/utils/environment';

/**
 * Request Size Limiting Middleware
 * Implements different size limits for different types of requests
 */

// Size limits for different request types
export const requestSizeLimits = {
  // General API requests
  general: env.REQUEST_SIZE_LIMIT_GENERAL || '1mb',

  // Authentication requests (login, register)
  auth: env.REQUEST_SIZE_LIMIT_AUTH || '500kb',

  // File uploads (assessments, documents)
  upload: env.REQUEST_SIZE_LIMIT_UPLOAD || '10mb',

  // AI/ML requests (can be larger due to context)
  ai: env.REQUEST_SIZE_LIMIT_AI || '5mb',

  // Survey responses (can be large with many questions)
  survey: env.REQUEST_SIZE_LIMIT_SURVEY || '2mb',

  // Admin operations (user management, etc.)
  admin: env.REQUEST_SIZE_LIMIT_ADMIN || '1mb',

  // Default fallback
  default: env.REQUEST_SIZE_LIMIT_DEFAULT || '1mb'
};

/**
 * Parse size string to bytes for comparison
 */
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2];

  return Math.floor(value * units[unit]);
}

/**
 * Get appropriate size limit for request path
 */
function getSizeLimitForPath(path: string): string {
  // Authentication endpoints
  if (path.includes('/api/login') ||
    path.includes('/api/register') ||
    path.includes('/api/signup') ||
    path.includes('/api/auth/')) {
    return requestSizeLimits.auth;
  }

  // File upload endpoints
  if (path.includes('/api/upload') ||
    path.includes('/api/assessment') ||
    path.includes('/api/survey/upload') ||
    path.includes('/uploads/')) {
    return requestSizeLimits.upload;
  }

  // AI/ML endpoints
  if (path.includes('/api/ai/') ||
    path.includes('/api/analysis') ||
    path.includes('/api/suggestions')) {
    return requestSizeLimits.ai;
  }

  // Survey endpoints
  if (path.includes('/api/survey') && !path.includes('/upload')) {
    return requestSizeLimits.survey;
  }

  // Admin endpoints
  if (path.includes('/api/admin') ||
    path.includes('/api/users') ||
    path.includes('/api/teams')) {
    return requestSizeLimits.admin;
  }

  // Default for all other requests
  return requestSizeLimits.general;
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimiter(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const method = req.method;

  // Skip size limiting for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Get appropriate size limit for this request
  const sizeLimit = getSizeLimitForPath(path);
  const maxSizeBytes = parseSize(sizeLimit);

  // Set up request size monitoring
  let receivedBytes = 0;

  // Override the request's data event handlers
  const originalOn = req.on.bind(req);
  const originalAddListener = req.addListener.bind(req);

  req.on = function (event: string, listener: any) {
    if (event === 'data') {
      return originalOn(event, (chunk: Buffer) => {
        receivedBytes += chunk.length;

        if (receivedBytes > maxSizeBytes) {
          return res.status(413).json({
            success: false,
            error: {
              code: 'REQUEST_TOO_LARGE',
              message: `Request size exceeds limit of ${sizeLimit}. Received ${Math.round(receivedBytes / 1024)}kb.`,
              limit: sizeLimit,
              received: `${Math.round(receivedBytes / 1024)}kb`
            }
          });
        }

        listener(chunk);
      });
    }
    return originalOn(event, listener);
  };

  req.addListener = function (event: string, listener: any) {
    if (event === 'data') {
      return originalAddListener(event, (chunk: Buffer) => {
        receivedBytes += chunk.length;

        if (receivedBytes > maxSizeBytes) {
          return res.status(413).json({
            success: false,
            error: {
              code: 'REQUEST_TOO_LARGE',
              message: `Request size exceeds limit of ${sizeLimit}. Received ${Math.round(receivedBytes / 1024)}kb.`,
              limit: sizeLimit,
              received: `${Math.round(receivedBytes / 1024)}kb`
            }
          });
        }

        listener(chunk);
      });
    }
    return originalAddListener(event, listener);
  };

  next();
}

/**
 * Content-Type validation middleware
 */
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  const contentType = req.get('Content-Type');
  const method = req.method;

  // Skip validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Skip validation for file uploads (multipart/form-data)
  if (contentType && contentType.includes('multipart/form-data')) {
    return next();
  }

  // Require JSON content type for API requests
  if (req.path.startsWith('/api/') && method !== 'GET') {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json for API requests',
          received: contentType || 'none'
        }
      });
    }
  }

  next();
}

