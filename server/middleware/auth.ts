import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

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
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  
  next();
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization denied. No token provided."
      });
    }
    
    // Extract the token
    const token = authHeader.split(" ")[1];
    
    // Verify the token
    const decoded = storage.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    
    // Get user from database
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Add user ID to request, safely handling role
    let role = 'client';
    try {
      // @ts-ignore - Handle if role property doesn't exist on user
      if (user.role) {
        role = user.role;
      } else if (storage.isAdmin(user.email)) {
        role = 'admin';
      }
    } catch (e) {
      // Fallback to client if there's any error
      console.warn("Error determining user role, defaulting to client", e);
    }
    
    req.user = { 
      id: user.id,
      role
    };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication"
    });
  }
};