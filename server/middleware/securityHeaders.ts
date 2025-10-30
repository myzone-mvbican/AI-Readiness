import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { env } from 'server/utils/environment';
import { log } from "server/vite";

// ============================================================================
// HTTPS ENFORCEMENT (Custom - Production Only)
// ============================================================================

/**
 * Check if request is secure (HTTPS)
 */
function isSecure(req: Request): boolean {
  // Check if request is already HTTPS
  if (req.secure) {
    return true;
  }

  // Check X-Forwarded-Proto header (for load balancers/proxies)
  const forwardedProto = req.get('X-Forwarded-Proto');
  if (forwardedProto === 'https') {
    return true;
  }

  // Check X-Forwarded-Ssl header (alternative header)
  const forwardedSsl = req.get('X-Forwarded-Ssl');
  if (forwardedSsl === 'on') {
    return true;
  }

  // Check if behind a proxy that sets secure flag
  if (req.get('X-Forwarded-For') && req.get('X-Forwarded-Proto') === 'https') {
    return true;
  }

  return false;
}

/**
 * Get the HTTPS URL for redirect
 */
function getHttpsUrl(req: Request): string {
  const host = req.get('host') || 'localhost';
  const path = req.originalUrl || req.url;

  // Use FRONTEND_URL if available, otherwise use request host
  const domain = env.FRONTEND_URL || host;

  // If domain already includes protocol, use it as-is, otherwise add https://
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return `${domain}${path}`;
  }

  return `https://${domain}${path}`;
}

/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP requests to HTTPS in production only
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  // Only enforce HTTPS in production
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  // Skip HTTPS enforcement for health checks and internal endpoints
  if (req.path === '/api/health' || req.path === '/health' || req.path.startsWith('/internal/')) {
    return next();
  }

  // Check if request is already secure
  if (isSecure(req)) {
    return next();
  }

  // Get HTTPS URL for redirect
  const httpsUrl = getHttpsUrl(req);

  // Log the redirect for monitoring
  console.log(`HTTPS redirect: ${req.method} ${req.url} -> ${httpsUrl}`);

  // Redirect to HTTPS with 301 (permanent redirect)
  return res.redirect(301, httpsUrl);
}

/**
 * HTTPS Certificate Validation Middleware
 * Validates SSL certificate in production
 */
export function validateHttpsCertificate(req: Request, res: Response, next: NextFunction) {
  // Only validate in production
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  // Check for SSL certificate issues
  const sslError = req.get('X-SSL-Error');
  if (sslError) {
    console.error('SSL Certificate Error:', sslError);
    return res.status(400).json({
      success: false,
      error: {
        code: 'SSL_CERTIFICATE_ERROR',
        message: 'SSL certificate validation failed'
      }
    });
  }

  next();
}

/**
 * Helmet Configuration
 * Environment-aware security headers using Helmet.js
 */
const helmetConfig = {
  // Content Security Policy - Development friendly
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: env.NODE_ENV === 'production' 
        ? ["'self'"] 
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://use.typekit.net", "https://p.typekit.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https://use.typekit.net", "https://fonts.googleapis.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"], // Allow media access for microphone
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // HSTS - Only in production and for HTTPS requests
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  
  // Frame Options
  frameguard: { action: 'deny' as const },
  
  // Content Type Options
  noSniff: true,
  
  // XSS Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: ['self'],
    geolocation: [],
    payment: [],
    usb: []
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Cross-Origin Embedder Policy (only in production)
  crossOriginEmbedderPolicy: env.NODE_ENV === "production" ? { policy: "credentialless" as const } : false,
  
  // Cross-Origin Opener Policy (only in production)
  crossOriginOpenerPolicy: env.NODE_ENV === 'production' ? { policy: 'same-origin' as const } : false,
  
  // Cross-Origin Resource Policy (only in production)
  crossOriginResourcePolicy: env.NODE_ENV === 'production' ? { policy: 'cross-origin' as const } : false,
};

/**
 * Security Headers Middleware
 * Uses Helmet.js for standard security headers with environment-aware configuration
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Apply Helmet configuration
  helmet(helmetConfig)(req, res, next);
}

/**
 * HTTPS Security Headers Middleware
 * Sets additional security headers for HTTPS requests only
 */
export function httpsSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Only apply additional headers for HTTPS requests
  if (isSecure(req)) {
    // Set secure cookie flag
    res.cookie('secure-flag', 'true', {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  next();
}

/**
 * Security Configuration Validation
 * Validates security configuration on startup
 */
export function validateSecurityConfig(): void {
  const environment = env.NODE_ENV === 'production' ? 'REMOTE' : 'LOCAL';

  log('='.repeat(60));
  log('🔒 SECURITY CONFIGURATION:');
  log('='.repeat(60));
  log(`📍 Environment: Helmet.js - ${environment}`);
  log(`🔐 HTTPS Enforcement: ${environment === 'REMOTE' ? 'Enabled' : 'Disabled'}`);
  log(`🛡️  HSTS Headers: ${environment === 'REMOTE' ? 'Enabled' : 'Disabled'}`);
  
  if (environment === 'REMOTE' && !env.FRONTEND_URL) {
    log('⚠️  WARNING: FRONTEND_URL not set. HTTPS redirects will use request Host header.');
  }
  
  log('='.repeat(60));
}
