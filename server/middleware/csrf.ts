import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from "server/utils/environment";
import { RedisCache } from "server/cache";

// CSRF token management for JWT authentication

/**
 * CSRF Protection Middleware
 * Implements CSRF token generation, validation, and SameSite cookie protection
 * Uses Redis for token storage with 1-hour TTL
 */

// CSRF token TTL (1 hour in seconds)
const CSRF_TOKEN_TTL = 60 * 60;

/**
 * Generate CSRF token for JWT authentication
 */
export const generateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP address as fallback identifier (no sessions in JWT auth)
    const sessionId = req.ip || 'unknown';

    // Check if we already have a valid token for this IP
    const existingTokenStr = await RedisCache.getWithNamespace('csrf', sessionId);
    if (existingTokenStr) {
      const existingToken = JSON.parse(existingTokenStr);
      if (existingToken.expires > Date.now()) {
        // Token already exists and is valid, just set the cookie
        res.cookie('csrf-token', existingToken.token, {
          httpOnly: false,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000
        });

        return next();
      }
    }

    // Generate a new token only if none exists or it's expired
    const token = crypto.randomBytes(32).toString('hex');

    // Store token with 1 hour expiry in Redis
    const tokenData = {
      token,
      expires: Date.now() + (60 * 60 * 1000) // 1 hour
    };
    
    await RedisCache.setWithNamespace('csrf', sessionId, JSON.stringify(tokenData), CSRF_TOKEN_TTL);

    // Set CSRF token in cookie
    res.cookie('csrf-token', token, {
      httpOnly: false, // Allow client-side access for form submission
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax', // Always allow client-side access
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // Add token to response for API clients
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

    // Use IP address as fallback identifier (no sessions in JWT auth)
    const sessionId = req.ip || 'unknown';
    const storedTokenStr = await RedisCache.getWithNamespace('csrf', sessionId);

    if (!storedTokenStr) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token not found. Please refresh the page and try again.'
        }
      });
    }

    const storedToken = JSON.parse(storedTokenStr);

    // Check if token is expired
    if (storedToken.expires < Date.now()) {
      await RedisCache.delWithNamespace('csrf', sessionId);
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_EXPIRED',
          message: 'CSRF token has expired. Please refresh the page and try again.'
        }
      });
    }

    // Get token from request (header or body)
    const tokenFromRequest = req.headers['x-csrf-token'] as string || req.body._csrf;

    if (!tokenFromRequest) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this operation.'
        }
      });
    }

    // Check only Redis-stored token (no session-based tokens in JWT auth)
    const isValidToken = tokenFromRequest === storedToken.token;

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