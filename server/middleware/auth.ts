import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { TokenService } from "../services/token.service";

// Extend the Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role?: string;
      };
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Expects a JWT token in the Authorization header (Bearer token)
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no token is present
 * Useful for endpoints that support both authenticated and guest users
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get access token from HttpOnly cookie
    const accessToken = TokenService.getTokenFromRequest(req, 'access');

    if (!accessToken) {
      // No token, continue without setting req.user (guest user)
      return next();
    }

    // Verify the access token
    const decoded = TokenService.verifyAccessToken(accessToken);

    if (!decoded) {
      // Invalid token, continue without setting req.user (guest user)
      return next();
    }

    // Get user from database
    const user = await UserService.getById(decoded.userId);

    if (!user) {
      // User not found, continue without setting req.user (guest user)
      return next();
    }

    // Add user ID to request, safely handling role
    let role = "client";
    try {
      // @ts-ignore - Handle if role property doesn't exist on user
      if (user.role) {
        role = user.role;
      } else if (UserService.isAdmin(user.email)) {
        role = "admin";
      }
    } catch (e) {
      // Fallback to client if there's any error
    }

    req.user = {
      id: user.id,
      role,
    };

    next();
  } catch (error) {
    // On error, continue without authentication (don't block the request)
    console.error("Optional authentication error:", error);
    next();
  }
};

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get access token from HttpOnly cookie
    const accessToken = TokenService.getTokenFromRequest(req, 'access');

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authorization denied. No access token provided.",
      });
    }

    // Verify the access token
    const decoded = TokenService.verifyAccessToken(accessToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    // Get user from database
    const user = await UserService.getById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Add user ID to request, safely handling role
    let role = "client";
    try {
      // @ts-ignore - Handle if role property doesn't exist on user
      if (user.role) {
        role = user.role;
      } else if (UserService.isAdmin(user.email)) {
        role = "admin";
      }
    } catch (e) {
      // Fallback to client if there's any error
    }

    req.user = {
      id: user.id,
      role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};
