import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  teams,
  users,
  userTeams,
  surveys 
} from "@shared/schema";
import Papa from 'papaparse';
import {
  insertUserSchema, 
  updateUserSchema, 
  loginSchema,
  insertTeamSchema,
  userTeamSchema,
  googleAuthSchema,
  googleConnectSchema,
  insertSurveySchema,
  updateSurveySchema
} from "@shared/validation/schemas";
import { GoogleUserPayload } from "@shared/types";
import { authenticate, requireAdmin } from "./middleware/auth";
import { upload } from "./middleware/upload";
import cors from "cors";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { parse } from "papaparse";
import * as fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors());

  // API routes - path prefixed with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });
  
  // Endpoint to serve CSV files directly - with fallback to default survey
  app.get("/api/csv-file/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log("CSV file requested:", filename);
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: "Filename is required"
        });
      }
      
      // List of possible places to look for the file
      const possiblePaths = [
        `${process.cwd()}/public/uploads/${filename}`,   // New primary location
        `${process.cwd()}/uploads/${filename}`,          // Legacy location
        `/uploads/${filename}`,                          // Relative path
        `${process.cwd()}/public/${filename}`,           // Public directory
        `${process.cwd()}/uploads/surveys/${filename}`,  // Possible subdirectory
      ];
      
      console.log("Looking for CSV file in these locations:", possiblePaths);
      
      // Check multiple file paths
      let fileContent = null;
      let foundPath = null;
      
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          console.log("File found at:", path);
          foundPath = path;
          fileContent = fs.readFileSync(path, 'utf8');
          break;
        }
      }
      
      // If still not found, try to check all existing surveys and find a match
      if (!fileContent) {
        console.log("File not found in standard locations, checking default survey files");
        
        // Check for test file first
        const testFilePath = `${process.cwd()}/public/uploads/survey-test.csv`;
        if (fs.existsSync(testFilePath)) {
          console.log("Using test survey file:", testFilePath);
          fileContent = fs.readFileSync(testFilePath, 'utf8');
          foundPath = testFilePath;
        } else {
          // Check in various directories
          const directories = [
            `${process.cwd()}/public/uploads/`,
            `${process.cwd()}/uploads/`,
          ];
          
          for (const dir of directories) {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              // Look for any survey CSV files
              const surveyFiles = files.filter(file => file.startsWith('survey-') && file.endsWith('.csv'));
              
              if (surveyFiles.length > 0) {
                // Use the first survey file found
                const defaultSurveyPath = `${dir}${surveyFiles[0]}`;
                console.log("Using default survey file:", defaultSurveyPath);
                fileContent = fs.readFileSync(defaultSurveyPath, 'utf8');
                foundPath = defaultSurveyPath;
                break;
              }
            }
          }
        }
      }
      
      // If we still don't have a file, give up
      if (!fileContent) {
        console.error("No survey file could be found");
        return res.status(404).json({
          success: false,
          message: "No survey file could be found"
        });
      }
      
      console.log(`Serving CSV file from ${foundPath} (${fileContent.length} bytes)`);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send the file content
      return res.send(fileContent);
    } catch (error) {
      console.error("Error serving CSV file:", error);
      return res.status(500).json({
        success: false,
        message: "Error serving CSV file"
      });
    }
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
      
      // Auto-assign user to the "Client" team
      try {
        // Check if user's email is part of the myzone.ai domain (admin users)
        const isMyZoneEmail = user.email.endsWith('@myzone.ai');
        
        // Determine which team to assign: 
        // - If it's a myzone.ai email, they already get admin role from isAdmin check
        // - Otherwise, find or create the standard "Client" team and assign them
        if (!isMyZoneEmail) {
          // Look for the Client team
          let clientTeam = await storage.getTeamByName("Client");
          
          // If Client team doesn't exist, create it
          if (!clientTeam) {
            clientTeam = await storage.createTeam({
              name: "Client"
            });
            console.log("Created default Client team");
          }
          
          // Add user to the Client team
          await storage.addUserToTeam({
            userId: user.id,
            teamId: clientTeam.id,
            role: "client"
          });
          
          console.log(`Auto-assigned user ${user.email} to Client team`);
        }
      } catch (teamError) {
        console.error("Error assigning user to team:", teamError);
        // Continue with user creation even if team assignment fails
      }
      
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
      
      // Get user from database with a fresh query
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Log the user data being sent
      console.log("Sending user data:", { 
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        employeeCount: user.employeeCount,
        industry: user.industry
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Add cache control headers to prevent browser caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
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
  
  // Google OAuth login/signup endpoint
  app.post("/api/auth/google/login", async (req, res) => {
    try {
      // Validate the input
      const result = googleAuthSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google authentication data",
          errors: result.error.format()
        });
      }

      const { credential } = req.body;

      // Verify the Google token
      const googleUserData = await storage.verifyGoogleToken(credential);
      if (!googleUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token"
        });
      }

      // Check if a user with this Google ID already exists
      let user = await storage.getUserByGoogleId(googleUserData.sub);
      
      if (!user) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(googleUserData.email);
        
        if (!user) {
          // Create a new user with data from Google
          const randomPassword = Array(16)
            .fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*")
            .map(chars => chars[Math.floor(Math.random() * chars.length)])
            .join('');
          
          user = await storage.createUser({
            name: googleUserData.name,
            email: googleUserData.email,
            password: randomPassword, // Random password as it won't be used
            googleId: googleUserData.sub
          });
          
          // Auto-assign user to the "Client" team
          try {
            // Check if user's email is part of the myzone.ai domain (admin users)
            const isMyZoneEmail = user.email.endsWith('@myzone.ai');
            
            // Only assign to Client team if not a myzone email (admins)
            if (!isMyZoneEmail) {
              // Look for the Client team
              let clientTeam = await storage.getTeamByName("Client");
              
              // If Client team doesn't exist, create it
              if (!clientTeam) {
                clientTeam = await storage.createTeam({
                  name: "Client"
                });
                console.log("Created default Client team");
              }
              
              // Add user to the Client team
              await storage.addUserToTeam({
                userId: user.id,
                teamId: clientTeam.id,
                role: "client"
              });
              
              console.log(`Auto-assigned Google user ${user.email} to Client team`);
            }
          } catch (teamError) {
            console.error("Error assigning Google user to team:", teamError);
            // Continue with user creation even if team assignment fails
          }
        } else {
          // User exists with this email but not connected to Google yet
          // Connect the Google ID to this user
          user = await storage.updateUser(user.id, { googleId: googleUserData.sub });
        }
      }

      // Generate JWT token
      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Failed to authenticate with Google",
        });
      }
      
      const token = storage.generateToken(user);
      
      // Remove password from response (TypeScript now knows user is defined)
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        success: true,
        message: "Google authentication successful",
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Google authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Google authentication failed due to an unexpected error"
      });
    }
  });
  
  // Connect Google account to existing user (protected route)
  app.post("/api/auth/google/connect", authenticate, async (req, res) => {
    try {
      // Validate the input
      const result = googleConnectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google connect data",
          errors: result.error.format()
        });
      }
      
      const userId = req.user!.id;
      const { credential } = req.body;
      
      // Verify the Google token
      const googleUserData = await storage.verifyGoogleToken(credential);
      if (!googleUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token"
        });
      }
      
      // Check if another user has already connected this Google account
      const existingUser = await storage.getUserByGoogleId(googleUserData.sub);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: "This Google account is already connected to another user"
        });
      }
      
      // Connect Google account to current user
      const updatedUser = await storage.connectGoogleAccount(userId, googleUserData.sub);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to connect Google account"
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        success: true,
        message: "Google account connected successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Google connect error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to connect Google account"
      });
    }
  });
  
  // Disconnect Google account from existing user (protected route)
  app.delete("/api/auth/google/disconnect", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Check if user has Google account connected
      if (!user.googleId) {
        return res.status(400).json({
          success: false,
          message: "No Google account is connected to this user"
        });
      }
      
      // Disconnect Google account
      const updatedUser = await storage.disconnectGoogleAccount(userId);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to disconnect Google account"
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        success: true,
        message: "Google account disconnected successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Google disconnect error:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to disconnect Google account"
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

  // Team endpoints (all protected routes)
  
  // Get teams for current user
  app.get("/api/teams", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      const teams = await storage.getTeamsByUserId(userId);
      
      return res.status(200).json({
        success: true,
        teams
      });
    } catch (error) {
      console.error("Get teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve teams"
      });
    }
  });
  
  // Create a new team
  app.post("/api/teams", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate team data
      const result = insertTeamSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid team data",
          errors: result.error.format()
        });
      }
      
      // Create team
      const team = await storage.createTeam(req.body);
      
      // Add current user to team as admin
      await storage.addUserToTeam({
        userId,
        teamId: team.id,
        role: "admin"
      });
      
      return res.status(201).json({
        success: true,
        message: "Team created successfully",
        team
      });
    } catch (error) {
      console.error("Create team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create team"
      });
    }
  });
  
  // Admin-only: Get all teams
  app.get("/api/admin/teams", authenticate, requireAdmin, async (req, res) => {
    try {
      // Get all teams from database
      const allTeams = await db.select().from(teams);
      
      return res.status(200).json({
        success: true,
        teams: allTeams
      });
    } catch (error) {
      console.error("Admin get teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve all teams"
      });
    }
  });
  
  // Admin-only: Get all users
  app.get("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      // Import necessary modules
      const { users } = await import("@shared/schema");
      
      // Get basic user information excluding passwords
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        company: users.company,
        employeeCount: users.employeeCount,
        industry: users.industry,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);
      
      // For each user, get their teams
      const usersWithTeams = await Promise.all(
        allUsers.map(async (user) => {
          const teams = await storage.getTeamsByUserId(user.id);
          return {
            ...user,
            teams: teams
          };
        })
      );
      
      return res.status(200).json({
        success: true,
        users: usersWithTeams
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user list"
      });
    }
  });
  
  // Admin-only: Update a user
  app.put("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;
      
      // Prevent admins from modifying their own accounts through this endpoint
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot modify your own account through this endpoint. Please use /api/user instead."
        });
      }
      
      // Validate data
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid update data",
          errors: result.error.format()
        });
      }
      
      // If updating password, hash it first
      let updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await storage.hashPassword(updateData.password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user"
      });
    }
  });
  
  // Admin-only: Delete a user
  app.delete("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;
      
      // Prevent admins from deleting their own accounts
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own account"
        });
      }
      
      // Delete user
      try {
        const success = await storage.deleteUser(userId);
        
        if (!success) {
          return res.status(404).json({
            success: false,
            message: "User not found or could not be deleted"
          });
        }
        
        return res.status(200).json({
          success: true,
          message: "User deleted successfully"
        });
      } catch (err) {
        // Handle specific database errors
        if (err.code === '23503') { // Foreign key constraint violation
          return res.status(400).json({
            success: false,
            message: "User could not be deleted because they still have associated data. Please contact an administrator."
          });
        }
        throw err; // Re-throw for the outer catch block
      }
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete user"
      });
    }
  });
  
  // Admin-only: Update a user's team assignments
  app.patch("/api/users/:id/teams", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;
      
      // Prevent admins from modifying their own team assignments through this endpoint
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot modify your own team assignments through this endpoint"
        });
      }
      
      const { teamIds } = req.body;
      
      if (!Array.isArray(teamIds)) {
        return res.status(400).json({
          success: false,
          message: "teamIds must be an array of team IDs"
        });
      }
      
      // Update user team assignments
      await storage.updateUserTeams(userId, teamIds);
      
      // Get updated teams for this user
      const updatedTeams = await storage.getTeamsByUserId(userId);
      
      return res.status(200).json({
        success: true,
        message: "User team assignments updated successfully",
        teams: updatedTeams
      });
    } catch (error) {
      console.error("Update user teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user team assignments"
      });
    }
  });
  
  // Check if a user exists by email - this endpoint is public for guest assessment flow
  app.get("/api/users/check-email", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }
      
      // Check if a user with this email exists
      const user = await storage.getUserByEmail(email);
      
      // Return whether the user exists, without exposing any user data
      res.status(200).json({
        success: true,
        exists: !!user
      });
    } catch (error) {
      console.error("Error checking user email:", error);
      res.status(500).json({
        success: false,
        message: "Error checking user email",
      });
    }
  });
  
  // Add user to team
  app.post("/api/teams/:teamId/users", authenticate, async (req, res) => {
    try {
      const userId = req.user!.id;
      const teamId = parseInt(req.params.teamId);
      
      // Validate user is admin of this team
      const userTeams = await storage.getTeamsByUserId(userId);
      const isAdmin = userTeams.some(team => 
        team.id === teamId && team.role === "admin"
      );
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add users to this team"
        });
      }
      
      // Validate data
      const result = userTeamSchema.safeParse({
        ...req.body,
        teamId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid user team data",
          errors: result.error.format()
        });
      }
      
      // Add user to team
      const userTeam = await storage.addUserToTeam({
        ...req.body,
        teamId
      });
      
      return res.status(201).json({
        success: true,
        message: "User added to team successfully",
        userTeam
      });
    } catch (error) {
      console.error("Add user to team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add user to team"
      });
    }
  });

  // Survey Administration routes (admin only)
  
  // Get all surveys for a team
  app.get("/api/admin/surveys/:teamId", authenticate, requireAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid team ID"
        });
      }
      
      // Team ID 0 is a special case to fetch all global surveys only
      const surveysWithAuthors = await storage.getSurveysWithAuthors(teamId);
      
      return res.status(200).json({
        success: true,
        surveys: surveysWithAuthors
      });
    } catch (error) {
      console.error("Error getting surveys:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve surveys"
      });
    }
  });
  
  // Get a specific survey with author details
  app.get("/api/admin/surveys/detail/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }
      
      const survey = await storage.getSurveyWithAuthor(surveyId);
      
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        survey
      });
    } catch (error) {
      console.error(`Error getting survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve survey"
      });
    }
  });
  
  // Create a new survey with file upload
  app.post("/api/admin/surveys", authenticate, requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "CSV file is required" 
        });
      }
      
      // Get form data
      const { title, teamId, questionsCount, status } = req.body;
      
      // Validate required fields
      if (!title || !questionsCount) {
        // Delete the uploaded file if validation fails
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields. Title and questionsCount are required."
        });
      }
      
      // Create survey data
      const questionsCountNum = parseInt(questionsCount);
      
      // Optional teamId (null means global survey)
      let teamIdNum = null;
      if (teamId) {
        teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
          // Non-empty but invalid teamId
          // Delete the uploaded file if validation fails
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
          
          return res.status(400).json({ 
            success: false, 
            message: "Invalid team ID format. Must be a valid number or empty for global surveys."
          });
        }
      }
      
      if (isNaN(questionsCountNum)) {
        // Delete the uploaded file if validation fails
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Invalid questions count format. Must be a valid number."
        });
      }
      
      // Process multiple teams (from teamIds string)
      let selectedTeamIds: number[] = [];
      if (req.body.teamIds) {
        try {
          // Parse the teamIds string, which can be either "global" or a JSON array of team IDs
          if (req.body.teamIds === "global") {
            // Global survey - no teams assigned
            selectedTeamIds = [];
          } else {
            selectedTeamIds = JSON.parse(req.body.teamIds);
            if (!Array.isArray(selectedTeamIds)) {
              throw new Error("teamIds must be an array");
            }
          }
        } catch (error) {
          console.error("Invalid teamIds format:", error);
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            success: false,
            message: "Invalid teamIds format. Must be 'global' or a JSON array."
          });
        }
      }
      
      // Create survey data object with cleaned values
      const surveyData = {
        title,
        questionsCount: questionsCountNum,
        status: status || 'draft',
        fileReference: req.file.path,
        authorId: req.user!.id
      };
      
      // Only add teamId if it has a valid value (not null or undefined)
      // This is kept for backward compatibility - we'll use the junction table going forward
      if (teamIdNum !== null && teamIdNum !== undefined) {
        Object.assign(surveyData, { teamId: teamIdNum });
      }
      
      const newSurvey = await storage.createSurvey(surveyData);
      
      // Now, if we have selected team IDs, assign them using the junction table
      if (selectedTeamIds.length > 0) {
        await storage.updateSurveyTeams(newSurvey.id, selectedTeamIds);
      }
      
      return res.status(201).json({
        success: true,
        message: "Survey created successfully",
        survey: newSurvey
      });
    } catch (error) {
      console.error("Error creating survey:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create survey"
      });
    }
  });
  
  // Update a survey with optional file upload
  app.put("/api/admin/surveys/:id", authenticate, requireAdmin, upload.single('file'), async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        // Clean up any uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }
      
      // Check if survey exists
      const existingSurvey = await storage.getSurveyById(surveyId);
      if (!existingSurvey) {
        // Clean up any uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      // Ensure the user is the author of the survey
      if (existingSurvey.authorId !== req.user!.id) {
        // Clean up any uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(403).json({
          success: false,
          message: "Only the author can update this survey"
        });
      }
      
      // Prepare update data
      const updateData: any = {};
      
      // Update title if provided
      if (req.body.title) {
        updateData.title = req.body.title;
      }
      
      // Update status if provided
      if (req.body.status) {
        updateData.status = req.body.status;
      }
      
      // Process team selection
      let selectedTeamIds: number[] = [];
      if (req.body.teamIds) {
        try {
          // Parse the teamIds string, which can be either "global" or a JSON array of team IDs
          if (req.body.teamIds === "global") {
            // Global survey - no teams assigned
            selectedTeamIds = [];
          } else {
            selectedTeamIds = JSON.parse(req.body.teamIds);
            if (!Array.isArray(selectedTeamIds)) {
              throw new Error("teamIds must be an array");
            }
          }
        } catch (error) {
          console.error("Invalid teamIds format:", error);
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            success: false,
            message: "Invalid teamIds format. Must be 'global' or a JSON array."
          });
        }
      }
      
      // If a new file was uploaded, update file reference and questions count
      if (req.file) {
        // Delete the old file if it exists
        if (existingSurvey.fileReference && fs.existsSync(existingSurvey.fileReference)) {
          try {
            fs.unlinkSync(existingSurvey.fileReference);
          } catch (fileError) {
            console.error(`Error deleting file ${existingSurvey.fileReference}:`, fileError);
            // Continue with update even if file deletion fails
          }
        }
        
        updateData.fileReference = req.file.path;
        
        // If questions count is provided, use that value
        if (req.body.questionsCount) {
          const questionsCountNum = parseInt(req.body.questionsCount);
          
          if (isNaN(questionsCountNum)) {
            // Delete the uploaded file
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileError) {
              console.error(`Error deleting file ${req.file.path}:`, fileError);
            }
            
            return res.status(400).json({ 
              success: false, 
              message: "Invalid questions count format. Must be a valid number."
            });
          }
          
          updateData.questionsCount = questionsCountNum;
        }
      }
      
      const updatedSurvey = await storage.updateSurvey(surveyId, updateData);
      
      // Update assigned teams if provided
      if (req.body.teamIds) {
        await storage.updateSurveyTeams(surveyId, selectedTeamIds);
      }
      
      return res.status(200).json({
        success: true,
        message: "Survey updated successfully",
        survey: updatedSurvey
      });
    } catch (error) {
      console.error(`Error updating survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to update survey"
      });
    }
  });
  
  // Get teams assigned to a survey
  app.get("/api/admin/surveys/:id/teams", authenticate, requireAdmin, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }
      
      // Check if survey exists
      const survey = await storage.getSurveyById(surveyId);
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      // Get teams associated with this survey
      const teamIds = await storage.getSurveyTeams(surveyId);
      
      return res.status(200).json({
        success: true,
        teamIds
      });
    } catch (error) {
      console.error(`Error retrieving teams for survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve teams for survey"
      });
    }
  });
  
  // Delete a survey and its file
  app.delete("/api/admin/surveys/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }
      
      // Check if survey exists
      const existingSurvey = await storage.getSurveyById(surveyId);
      if (!existingSurvey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      // Ensure the user is the author of the survey
      if (existingSurvey.authorId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "Only the author can delete this survey"
        });
      }
      
      // Delete the associated file if it exists
      if (existingSurvey.fileReference && fs.existsSync(existingSurvey.fileReference)) {
        try {
          fs.unlinkSync(existingSurvey.fileReference);
        } catch (fileError) {
          console.error(`Error deleting file ${existingSurvey.fileReference}:`, fileError);
          // Continue with survey deletion even if file deletion fails
        }
      }
      
      const deleted = await storage.deleteSurvey(surveyId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete survey"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Survey deleted successfully"
      });
    } catch (error) {
      console.error(`Error deleting survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete survey"
      });
    }
  });

  // User-facing survey routes
  
  // Get surveys for current user's selected team
  app.get("/api/surveys/:teamId", authenticate, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid team ID"
        });
      }
      
      // If the team ID is 0, we only want to get global surveys
      if (teamId === 0) {
        // Special case for global surveys (team ID null)
        const surveys = await storage.getSurveys(0);
        
        return res.status(200).json({
          success: true,
          surveys
        });
      }
      
      // For non-zero team IDs, verify access first
      const userTeams = await storage.getTeamsByUserId(req.user!.id);
      const teamIds = userTeams.map(team => team.id);
      
      // Check if user has access to this team
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this team's surveys"
        });
      }
      
      // Get surveys for the team, including global surveys
      const surveys = await storage.getSurveys(teamId);
      
      return res.status(200).json({
        success: true,
        surveys
      });
    } catch (error) {
      console.error("Error getting surveys:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve surveys"
      });
    }
  });
  
  // Get a specific survey
  // Public endpoint for guest users to access survey details
  app.get("/api/public/surveys/detail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }

      // Get survey details
      const survey = await storage.getSurveyById(id);
      
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }

      return res.status(200).json({
        success: true,
        survey
      });
    } catch (error) {
      console.error("Error fetching public survey:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch public survey"
      });
    }
  });
  
  // Get questions for a specific survey (public endpoint)
  app.get("/api/public/surveys/:id/questions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }

      // Get survey details
      const survey = await storage.getSurveyById(id);
      
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      // Read and parse the CSV file
      const fileContent = fs.readFileSync(survey.fileReference, 'utf8');
      
      // Parse CSV
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });
      
      // Map CSV data to questions with the correct column names
      const questions = parsedData.data
        .filter(row => row["Question Summary"]?.trim()) // Only include rows with non-empty questions
        .map((row: any, index: number) => {
          return {
            id: index + 1,
            question: row["Question Summary"] || "",
            category: row["Category"] || "",
            details: row["Question Details"] || ""
          };
        });

      return res.status(200).json({
        success: true,
        questions
      });
    } catch (error) {
      console.error("Error fetching survey questions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch survey questions"
      });
    }
  });
  
  // Create guest assessment (public endpoint)
  app.post("/api/public/assessments", async (req, res) => {
    try {
      const { 
        title, 
        surveyId, 
        email, 
        name, 
        company, 
        answers, 
        status, 
        score 
      } = req.body;

      if (!surveyId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment data. Required fields: surveyId, answers"
        });
      }

      // Validate required fields
      if (!title || !email || !name) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: title, email, name"
        });
      }

      // Parse surveyId to number if it's a string
      const surveyTemplateId = parseInt(surveyId);
      
      if (isNaN(surveyTemplateId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid surveyId: must be a number"
        });
      }

      // Create a guest assessment
      const assessmentData = {
        title,
        surveyTemplateId,
        userId: null, // null userId for guest assessments
        email,
        answers,
        status: status || "completed",
        score: score || 0
      };

      const assessment = await storage.createAssessment(assessmentData);

      return res.status(201).json({
        success: true,
        message: "Guest assessment created successfully",
        assessment
      });
    } catch (error) {
      console.error("Error creating guest assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create guest assessment"
      });
    }
  });

  // Original protected survey endpoint
  app.get("/api/surveys/detail/:id", authenticate, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID"
        });
      }
      
      const survey = await storage.getSurveyById(surveyId);
      
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }
      
      // Get all teams for the user to verify access
      const userTeams = await storage.getTeamsByUserId(req.user!.id);
      const teamIds = userTeams.map(team => team.id);
      
      // Check if survey is global (null teamId) or if user has access to any of the survey's teams
      const surveyTeamIds = await storage.getSurveyTeams(surveyId);
      
      // Allow access if:
      // 1. Survey is global (teamId is null and no teams assigned)
      // 2. User is part of any team the survey is assigned to
      const isGlobalSurvey = survey.teamId === null && surveyTeamIds.length === 0;
      const hasTeamAccess = surveyTeamIds.some(teamId => teamIds.includes(teamId));
      
      if (!isGlobalSurvey && !hasTeamAccess) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this survey"
        });
      }
      
      return res.status(200).json({
        success: true,
        survey
      });
    } catch (error) {
      console.error(`Error getting survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve survey"
      });
    }
  });

  // Assessment routes
  
  // Get all assessments for the current user
  app.get("/api/assessments", authenticate, async (req, res) => {
    try {
      const assessments = await storage.getAssessmentsByUserId(req.user!.id);
      
      return res.status(200).json({
        success: true,
        assessments
      });
    } catch (error) {
      console.error("Error fetching assessments:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assessments"
      });
    }
  });
  
  // Get a specific assessment by ID
  app.get("/api/assessments/:id", authenticate, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID"
        });
      }
      
      const assessment = await storage.getAssessmentWithSurveyInfo(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found"
        });
      }
      
      // Verify that the user owns this assessment
      if (assessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this assessment"
        });
      }
      
      return res.status(200).json({
        success: true,
        assessment
      });
    } catch (error) {
      console.error("Error fetching assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assessment"
      });
    }
  });
  
  // Create a new assessment
  app.post("/api/assessments", authenticate, async (req, res) => {
    try {
      const { surveyTemplateId, title } = req.body;
      
      if (!surveyTemplateId || !title) {
        return res.status(400).json({
          success: false,
          message: "Survey template ID and title are required"
        });
      }
      
      // Get the survey to prepare answers array
      const survey = await storage.getSurveyById(parseInt(surveyTemplateId));
      
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey template not found"
        });
      }
      
      // Create a blank answers array with just question IDs
      // We're using simple sequential numbering for question IDs: "q1", "q2", etc.
      const blankAnswers = Array.from({ length: survey.questionsCount }, (_, i) => ({
        q: i + 1
      }));
      
      // Create the assessment
      const newAssessment = await storage.createAssessment({
        title,
        surveyTemplateId: parseInt(surveyTemplateId),
        userId: req.user!.id,
        status: "draft",
        answers: blankAnswers
      });
      
      return res.status(201).json({
        success: true,
        assessment: newAssessment
      });
    } catch (error) {
      console.error("Error creating assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create assessment"
      });
    }
  });
  
  // Update an assessment (for saving answers or changing status)
  app.patch("/api/assessments/:id", authenticate, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID"
        });
      }
      
      // Get the existing assessment
      const existingAssessment = await storage.getAssessmentById(assessmentId);
      
      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found"
        });
      }
      
      // Verify ownership
      if (existingAssessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this assessment"
        });
      }
      
      // Check if the assessment is already completed
      if (existingAssessment.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot update a completed assessment"
        });
      }
      
      // Calculate score if moving to completed
      let score = null;
      if (req.body.status === "completed" && existingAssessment.status !== "completed") {
        // Calculate the score as sum of all answers
        const answers = req.body.answers || existingAssessment.answers;
        const answerValues = answers
          .map(a => {
            // Explicitly check for number type, including 0
            return typeof a.a === 'number' ? a.a : null;
          })
          .filter(value => value !== null); // Filter out null values
        
        console.log("Answer values for score calculation:", answerValues);
        
        // Only calculate score if there are answers
        if (answerValues.length > 0) {
          // Adjust score to be 0-100 
          // -2 to +2 per question, adjust to 0-4, convert to percentage
          const rawScore = answerValues.reduce((sum, val) => sum + val, 0);
          console.log("Raw score:", rawScore);
          
          const maxPossible = answers.length * 2; // Max score is +2 per question
          const adjustedScore = (rawScore + answers.length * 2) / (answers.length * 4) * 100;
          score = Math.round(adjustedScore);
          
          console.log("Adjusted score:", score);
        }
      }
      
      // Update the assessment
      const updatedAssessment = await storage.updateAssessment(assessmentId, {
        ...req.body,
        score
      });
      
      return res.status(200).json({
        success: true,
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error("Error updating assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update assessment"
      });
    }
  });
  
  // Delete an assessment
  app.delete("/api/assessments/:id", authenticate, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assessment ID"
        });
      }
      
      // Get the assessment to verify ownership
      const assessment = await storage.getAssessmentById(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: "Assessment not found"
        });
      }
      
      // Verify ownership
      if (assessment.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this assessment"
        });
      }
      
      // Delete the assessment
      const deleted = await storage.deleteAssessment(assessmentId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete assessment"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Assessment deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete assessment"
      });
    }
  });
    
  const httpServer = createServer(app);

  return httpServer;
}
