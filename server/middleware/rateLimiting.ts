import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request } from 'express';
import { env } from "server/utils/environment";

// Type definitions for enhanced request handling
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role?: string;
  };
}

// Enhanced key generator for user + IP based rate limiting
const enhancedKeyGenerator = (req: AuthenticatedRequest): string => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id || 'anonymous';
    // Normalize IP for IPv6 compatibility
    const normalizedIp = ip.replace(/:/g, '-').replace(/\./g, '-');
    return `${normalizedIp}-${userId}`;
  } catch (error) {
    // Fallback to IP-only key generation if user data is malformed
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  }
};

// Standard IP-only key generator
const ipOnlyKeyGenerator = (req: Request): string => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  } catch (error) {
    // Fallback for malformed IP addresses
    return 'unknown-ip';
  }
};

// Consistent skip logic for all middleware
const skipStaticAssets = (req: Request): boolean => {
  return req.path.startsWith('/static/') || 
         req.path.startsWith('/assets/') || 
         req.path.startsWith('/favicon.ico') ||
         req.path.startsWith('/_next/') ||
         req.path.startsWith('/@vite/') ||
         req.path === '/api/health' ||
         req.path === '/health';
};

/**
 * Rate limiting configuration for different endpoint types
 * Implements progressive delays and account lockout mechanisms
 */

// General API rate limiting (more lenient for development)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 5 : 20, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator for user + IP
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.'
      }
    });
  }
});

// Registration rate limiting (3 attempts per hour)
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 3 : 10, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  message: {
    success: false,
    error: {
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later.'
      }
    });
  }
});

// Password reset rate limiting (more lenient in development)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 3 : 20, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        message: 'Too many password reset attempts, please try again later.'
      }
    });
  }
});

// Sensitive operations rate limiting (10 requests per 5 minutes)
export const sensitiveOperationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: env.NODE_ENV === 'production' ? 10 : 50, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  message: {
    success: false,
    error: {
      code: 'SENSITIVE_OPERATIONS_RATE_LIMIT_EXCEEDED',
      message: 'Too many sensitive operations, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'SENSITIVE_OPERATIONS_RATE_LIMIT_EXCEEDED',
        message: 'Too many sensitive operations, please try again later.'
      }
    });
  }
});

// Progressive delay for repeated violations
export const progressiveDelay = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: env.NODE_ENV === 'production' ? 50 : 200, // More lenient in development
  delayMs: (used, req) => {
    const delayAfter = req.slowDown?.limit || (env.NODE_ENV === 'production' ? 50 : 200);
    return (used - delayAfter) * 500;
  },
  maxDelayMs: 20000, // max delay of 20 seconds
  skipSuccessfulRequests: true, // don't count successful requests
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  skip: skipStaticAssets, // Use consistent skip logic
});

// Account lockout mechanism (5 failed attempts = 30 minute lockout)
export const accountLockoutLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: env.NODE_ENV === 'production' ? 5 : 20, // More lenient in development
  keyGenerator: enhancedKeyGenerator, // Use enhanced key generator
  message: {
    success: false,
    error: {
      code: 'ACCOUNT_LOCKED',
      message: 'Account temporarily locked due to too many failed attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: skipStaticAssets, // Use consistent skip logic
  handler: (req, res) => {
    res.status(423).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Account temporarily locked due to too many failed attempts. Please try again later.'
      }
    });
  }
});

// ============================================================================
// PROGRESSIVE DELAY MIDDLEWARE (using express-slow-down)
// ============================================================================

// Progressive delay for authentication endpoints
export const authProgressiveDelay = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: env.NODE_ENV === 'production' ? 3 : 10, // Start delaying after 3 attempts
  delayMs: (used) => (used - 3) * 1000, // 1s, 2s, 3s, 4s...
  maxDelayMs: 15000, // max delay of 15 seconds
  skipSuccessfulRequests: true,
  keyGenerator: enhancedKeyGenerator,
  skip: skipStaticAssets,
});

// Progressive delay for sensitive operations
export const sensitiveOperationsProgressiveDelay = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: env.NODE_ENV === 'production' ? 5 : 20, // Start delaying after 5 attempts
  delayMs: (used) => (used - 5) * 500, // 0.5s, 1s, 1.5s, 2s...
  maxDelayMs: 10000, // max delay of 10 seconds
  skipSuccessfulRequests: true,
  keyGenerator: enhancedKeyGenerator,
  skip: skipStaticAssets,
});

// ============================================================================
// ENHANCED RATE LIMITERS (User + IP based, for use with progressive delays)
// ============================================================================

// Enhanced auth rate limiter (for use with authProgressiveDelay)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 10 : 50, // Higher limit when used with progressive delay
  keyGenerator: enhancedKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipStaticAssets,
});

// Enhanced sensitive operations rate limiter (for use with sensitiveOperationsProgressiveDelay)
export const sensitiveOperationsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: env.NODE_ENV === 'production' ? 20 : 100, // Higher limit when used with progressive delay
  keyGenerator: enhancedKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'SENSITIVE_OPERATIONS_RATE_LIMIT_EXCEEDED',
      message: 'Too many sensitive operations, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStaticAssets,
});

// ============================================================================
// STANDARD RATE LIMITERS (IP-based only, for general use)
// ============================================================================

// General API rate limiter (IP-based only)
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000,
  keyGenerator: ipOnlyKeyGenerator, // IP-only for general endpoints
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStaticAssets,
});
