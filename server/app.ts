// src/app.ts
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { env } from "server/utils/environment";
import { log } from "server/vite";
// Our App
import { registerRoutes } from "server/routes";
// Middlewares
import {
  requestSizeLimiter,
  validateContentType
} from "server/middleware/requestSizeLimits";
import {
  enforceHttps,
  securityHeaders,
  httpsSecurityHeaders,
  validateHttpsCertificate,
  validateSecurityConfig
} from "server/middleware/securityHeaders";
import { corsMiddleware } from "server/middleware/cors";
import { generateCSRFToken } from "server/middleware/csrf";
import { generalApiLimiter, progressiveDelay } from "server/middleware/rateLimiting";
import { generateRequestId } from "server/middleware/requestId";
// Session middleware removed - using JWT tokens instead

// If behind a proxy (Docker/Ingress), trust it for secure cookies
const app = express();

// ============================================================================
// APPLICATION-LEVEL INITIALIZATION
// ============================================================================

// Session store removed - using JWT tokens instead

// Trust proxy for accurate IP detection in rate limiting
// This is important when behind load balancers, CDNs, or reverse proxies
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // Trust first proxy
} else {
  app.set("trust proxy", true); // Trust all proxies in development
}

// ============================================================================
// MIDDLEWARE ORDERING - CRITICAL FOR SECURITY AND FUNCTIONALITY
// ============================================================================

// Validate security configuration
validateSecurityConfig();

// 1. REQUEST ID GENERATION (must be first for tracing)
// Generates unique request IDs for correlation across logs and debugging
app.use(generateRequestId);

// 2. HTTPS ENFORCEMENT (must be early in production)
// Redirects HTTP to HTTPS in production only
// app.use(enforceHttps);
// app.use(validateHttpsCertificate);

// 3. SECURITY HEADERS (Helmet.js + custom)
// Sets comprehensive security headers using Helmet.js with environment-aware configuration
// app.use(securityHeaders);
// app.use(httpsSecurityHeaders);

// 4. CORS (must be before request parsing for preflight requests)
// Handles cross-origin requests and OPTIONS preflight requests
app.use(corsMiddleware);

// 5. COOKIE PARSING (needed for JWT tokens and CSRF)
// Parses cookies from request headers for JWT token management
app.use(cookieParser());

// 6. RATE LIMITING (before parsing to protect against large requests)
// Protects against abuse and DoS attacks before expensive parsing
app.use(requestSizeLimiter);
app.use(validateContentType);
app.use(progressiveDelay);
app.use(generalApiLimiter);

// 7. REQUEST BODY PARSING (after rate limiting)
// Parses JSON and URL-encoded request bodies
// Note: Size limiting is handled by requestSizeLimiter middleware above
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware removed - using JWT tokens instead

// 8. CSRF PROTECTION
// Generates and validates CSRF tokens for state-changing operations
app.use(generateCSRFToken);

// 9. API LOGGING (after request parsing for complete information)
// Logs API requests and responses with timing and request ID correlation
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.traceId || 'unknown';

  // Log incoming requests
  if (req.path.startsWith("/api")) {
    log(`🚀 [${requestId}] ${req.method} ${req.path} - ${req.ip || 'unknown-ip'}`);
  }

  // Log response when finished
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      const status = res.statusCode;
      const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️ ' : '✅';
      log(`${statusIcon} [${requestId}] ${req.method} ${req.path} ${status} ${ms}ms`);
    }
  });

  // Log response on error
  res.on("error", (err) => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      log(`💥 [${requestId}] ${req.method} ${req.path} ERROR ${ms}ms - ${err.message}`);
    }
  });

  next();
});

// 10. APPLICATION ROUTES
// All API endpoints and business logic
registerRoutes(app);

// 11. ERROR HANDLING (must be last)
// Catches and handles all unhandled errors from the application
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || err.details || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// Export removed - no session store needed for JWT authentication
export default app;
