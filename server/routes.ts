import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, updateUserSchema, loginSchema } from "@shared/schema";
import { authenticate } from "./middleware/auth";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors());

  // API routes - path prefixed with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });

  // User signup endpoint (with support for both /signup and /register paths)
  app.post(["/api/signup", "/api/register"], async (req, res) => {
    try {
      // Validate the input
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid registration data", 
          errors: result.error.format() 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "A user with this email already exists" 
        });
      }

      // Create the new user
      const user = await storage.createUser(req.body);
      
      // Generate JWT token
      const token = storage.generateToken(user);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json({ 
        success: true, 
        message: "User registered successfully",
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Registration failed due to an unexpected error" 
      });
    }
  });
  
  // User login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      // Validate input
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid login data", 
          errors: result.error.format() 
        });
      }
      
      const { email, password } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Check if user exists
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }
      
      // Validate password
      const isPasswordValid = await storage.validatePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }
      
      // Generate JWT token
      const token = storage.generateToken(user);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({ 
        success: true, 
        message: "Login successful", 
        token,
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Login failed due to an unexpected error" 
      });
    }
  });
  
  // Get current user profile endpoint (protected route)
  app.get("/api/user", authenticate, async (req, res) => {
    try {
      // User ID comes from the authenticated user
      const userId = req.user!.id;
      
      // Get user from database
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve user information" 
      });
    }
  });
  
  // Update user profile endpoint (protected route)
  app.put("/api/user", authenticate, async (req, res) => {
    try {
      // User ID comes from the authenticated user
      const userId = req.user!.id;
      
      // Validate update data
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid update data", 
          errors: result.error.format() 
        });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // If updating password, ensure old password is correct
      if (req.body.password && req.body.currentPassword) {
        const isPasswordValid = await storage.validatePassword(
          req.body.currentPassword, 
          existingUser.password
        );
        
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Current password is incorrect"
          });
        }
      }
      
      // Prepare update data (remove currentPassword if present)
      const { currentPassword, ...updateData } = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user profile"
        });
      }
      
      // Force a re-fetch to ensure we have the most current data
      const refreshedUser = await storage.getUser(userId);
      
      if (!refreshedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve updated user profile"
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = refreshedUser;
      
      return res.status(200).json({ 
        success: true, 
        message: "User profile updated successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Update failed due to an unexpected error" 
      });
    }
  });
    
  const httpServer = createServer(app);

  return httpServer;
}
