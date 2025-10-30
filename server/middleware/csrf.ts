import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from "server/utils/environment";

// CSRF token management for JWT authentication

/**
 * CSRF Protection Middleware
 * Implements CSRF token generation, validation, and SameSite cookie protection
 * Uses Redis for token storage with 1-hour TTL
 */

// CSRF token TTL (1 hour in milliseconds)
const CSRF_TOKEN_TTL_MS = 60 * 60 * 1000;

// Cookie name used for CSRF token
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generate CSRF token for JWT authentication
 */
export const generateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If a CSRF cookie already exists, keep it; otherwise issue a new token
    const existing = req.cookies?.[CSRF_COOKIE_NAME];
    const token = existing || crypto.randomBytes(32).toString('hex');

    // Set/refresh CSRF token in cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Client must read it to send header (double-submit pattern)
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CSRF_TOKEN_TTL_MS,
    });

    // Expose for server-side rendered contexts if needed
    res.locals.csrfToken = token;

    next();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_ERROR',
        message: 'Failed to generate CSRF token'
      }
    });
  }
};

/**
 * Validate CSRF token for state-changing operations
 */
export const validateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF validation for authentication endpoints (they have their own protection)
    if (req.path.includes('/api/login') ||
      req.path.includes('/api/signup') ||
      req.path.includes('/api/register') ||
      req.path.includes('/api/auth/google')) {
      return next();
    }

    // Read token from header/body and compare to cookie (double-submit cookie pattern)
    const tokenFromRequest = (req.headers['x-csrf-token'] as string) || req.body?._csrf;
    const tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];

    if (!tokenFromRequest) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this operation.'
        }
      });
    }

    if (!tokenFromCookie) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token cookie is missing. Please refresh the page and try again.'
        }
      });
    }

    // Compare header/body token with cookie token
    const isValidToken = tokenFromRequest === tokenFromCookie;

    if (!isValidToken) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token. Please refresh the page and try again.'
        }
      });
    }

    // Token is valid, continue
    next();
  } catch (error) {
    console.error('CSRF validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_ERROR',
        message: 'CSRF validation failed'
      }
    });
  }
}; 