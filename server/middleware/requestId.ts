import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request interface to include traceId
declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

/**
 * Request ID Middleware
 * 
 * Generates a unique request ID for each incoming request to enable request tracing
 * and correlation across logs. Uses randomUUID() for standard UUID generation.
 * Respects existing x-request-id header if present (useful for load balancers/proxies).
 */
export const generateRequestId = (req: Request, res: Response, next: NextFunction) => {
  // Use existing request ID from header if present, otherwise generate new one
  req.traceId = req.get?.("x-request-id") || randomUUID();
  
  // Add request ID to response headers for client-side correlation
  res.setHeader('X-Request-ID', req.traceId);
  
  next();
};
