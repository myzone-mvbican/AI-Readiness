import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  updateUserSchema, 
  loginSchema,
  insertTeamSchema,
  userTeamSchema,
  googleAuthSchema,
  googleConnectSchema,
  insertSurveySchema,
  updateSurveySchema,
  teams,
  users,
  userTeams,
  surveys,
  type GoogleUserPayload
} from "@shared/schema";
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
      if (!title || !teamId || !questionsCount) {
        // Delete the uploaded file if validation fails
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields. Title, teamId, and questionsCount are required."
        });
      }
      
      // Create survey data
      const teamIdNum = parseInt(teamId);
      const questionsCountNum = parseInt(questionsCount);
      
      if (isNaN(teamIdNum)) {
        // Delete the uploaded file if validation fails
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Invalid team ID format. Must be a valid number."
        });
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
      
      const surveyData = {
        title,
        teamId: teamIdNum,
        questionsCount: questionsCountNum,
        status: status || 'draft',
        fileReference: req.file.path,
        authorId: req.user!.id
      };
      
      const newSurvey = await storage.createSurvey(surveyData);
      
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
      
      // Get all teams for the user to verify access
      const userTeams = await storage.getTeamsByUserId(req.user!.id);
      const teamIds = userTeams.map(team => team.id);
      
      // Check if user has access to this team
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this team's surveys"
        });
      }
      
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
      
      // Check if user has access to this survey's team
      if (!teamIds.includes(survey.teamId)) {
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
    
  const httpServer = createServer(app);

  return httpServer;
}
