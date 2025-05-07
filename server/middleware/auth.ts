import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend the Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Expects a JWT token in the Authorization header (Bearer token)
 */
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
    
    // Add user ID to request
    req.user = { id: user.id };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication"
    });
  }
};