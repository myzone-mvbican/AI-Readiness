import { Request, Response, NextFunction } from 'express';
import { log } from 'server/vite';

/**
 * Request Logging Middleware
 * 
 * Logs API requests and responses with timing and request ID correlation.
 * Captures request details at middleware time (not event time) to ensure
 * accurate logging even if request properties are modified by later middleware.
 * 
 * Follows the dual middleware pattern:
 * - Request ID generation is handled separately by generateRequestId middleware
 * - This middleware only handles logging functionality
 * 
 * Features:
 * - Filters to API requests only (/api prefix)
 * - Captures request timing for performance monitoring
 * - Status-based icons for visual clarity (✅, ⚠️, ❌, 💥)
 * - Error correlation with request ID for debugging
 */
export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.traceId || 'unknown';
  
  // Capture request details at middleware time (not event time)
  const requestPath = req.path;
  const requestMethod = req.method;
  const isApiRequest = requestPath.startsWith("/api");

  // Log incoming requests
  if (isApiRequest) {
    log(`🚀 [${requestId}] ${requestMethod} ${requestPath} - ${req.ip || 'unknown-ip'}`);
  }

  // Log response when finished
  res.on("finish", () => {
    if (isApiRequest) {
      const ms = Date.now() - start;
      const status = res.statusCode;
      const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️ ' : '✅';
      log(`${statusIcon} [${requestId}] ${requestMethod} ${requestPath} ${status} ${ms}ms`);
    }
  });

  // Log response on error
  res.on("error", (err) => {
    if (isApiRequest) {
      const ms = Date.now() - start;
      log(`💥 [${requestId}] ${requestMethod} ${requestPath} ERROR ${ms}ms - ${err.message}`);
    }
  });

  next();
};

