import { Request, Response } from "express"; 
import { UserModel } from "../models/user.model";
import { TeamModel } from "../models/team.model";
import { AssessmentModel } from "../models/assessment.model"; 
import {
  loginSchema,
  insertUserSchema,
  updateUserSchema,
  googleAuthSchema,
  googleConnectSchema,
  microsoftAuthSchema,
} from "@shared/validation/schemas";

export class AuthController {
  static async profile(req: Request, res: Response) {
    try {
      // User ID comes from the authenticated user
      const userId = req.user!.id;

      // Get user from database with a fresh query
      const user = await UserModel.getById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Add cache control headers to prevent browser caching
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      return res.status(200).json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user information",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      // User ID comes from the authenticated user
      const userId = req.user!.id;

      // Validate update data
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid update data",
          errors: result.error.format(),
        });
      }

      // Check if user exists
      const existingUser = await UserModel.getById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // If updating password, ensure old password is correct
      if (req.body.password && req.body.currentPassword) {
        const isPasswordValid = await UserModel.validatePassword(
          req.body.currentPassword,
          existingUser.password,
        );

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Current password is incorrect",
          });
        }
      }

      // Prepare update data (remove currentPassword if present)
      const { currentPassword, ...updateData } = req.body;

      // Update user
      const updatedUser = await UserModel.update(userId, updateData);

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user profile",
        });
      }

      // Force a re-fetch to ensure we have the most current data
      const refreshedUser = await UserModel.getById(userId);

      if (!refreshedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve updated user profile",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = refreshedUser;

      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({
        success: false,
        message: "Update failed due to an unexpected error",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Validate input
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid login data",
          errors: result.error.format(),
        });
      }

      const { email, password } = req.body;
      const user = await UserModel.getByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await UserModel.validatePassword(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = UserModel.generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Login failed due to an unexpected error",
      });
    }
  }

  static async loginGoogle(req: Request, res: Response) {
    try {
      // Validate the input
      const result = googleAuthSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google authentication data",
          errors: result.error.format(),
        });
      }

      const { credential } = req.body;

      // Verify the Google token
      const googleUserData = await UserModel.verifyGoogleToken(credential);
      if (!googleUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token",
        });
      }

      // Check if a user with this Google ID already exists
      let user = await UserModel.getByGoogleId(googleUserData.sub);

      if (!user) {
        // Check if user exists with this email
        user = await UserModel.getByEmail(googleUserData.email);

        if (!user) {
          // Create a new user with data from Google
          const randomPassword = Array(16)
            .fill(
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*",
            )
            .map((chars) => chars[Math.floor(Math.random() * chars.length)])
            .join("");

          user = await UserModel.create({
            name: googleUserData.name,
            email: googleUserData.email,
            password: randomPassword, // Random password as it won't be used
            googleId: googleUserData.sub,
          });

          // Auto-assign user to the "Client" team
          try {
            // Check if user's email is part of the myzone.ai domain (admin users)
            const isMyZoneEmail = user.email.endsWith("@myzone.ai");

            // Determine which team to assign:
            // - If it's a myzone.ai email, MyZone team
            // - Otherwise, Client team
            let defaultTeam = await TeamModel.getByName(
              isMyZoneEmail ? "MyZone" : "Client",
            );

            // Add user to the Default team
            if (defaultTeam) {
              await TeamModel.addUser({
                userId: user.id,
                teamId: defaultTeam.id,
                role: "client",
              });
            }
          } catch (teamError) {
            console.error("Error assigning user to team:", teamError);
            // Continue with user creation even if team assignment fails
          }

          // Check for guest assessments with this email and associate them with the new user
          try {
            await AssessmentModel.assignGuestAssessmentsToUser(user.email, user.id);
          } catch (err) {
            // Just log the error but don't fail registration if this fails
            console.error(
              "Error associating guest assessments with new user:",
              err,
            );
          }
        } else {
          // User exists with this email but not connected to Google yet
          // Connect the Google ID to this user
          user = await UserModel.update(user.id, {
            googleId: googleUserData.sub,
          });
        }
      }

      // Generate JWT token
      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Failed to authenticate with Google",
        });
      }

      const token = UserModel.generateToken(user);

      // Remove password from response (TypeScript now knows user is defined)
      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Google authentication successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Google authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Google authentication failed due to an unexpected error",
      });
    }
  }

  static async loginMicrosoft(req: Request, res: Response) {
    try {
      
      // Validate the input
      const result = microsoftAuthSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Microsoft authentication data",
          errors: result.error.format(),
        });
      }

      const { credential } = req.body;

      // Verify the Microsoft token
      const microsoftUserData = await UserModel.verifyMicrosoftToken(credential);
      if (!microsoftUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Microsoft token",
        });
      }

      // Check if a user with this Microsoft ID already exists
      let user = await UserModel.getByMicrosoftId(microsoftUserData.sub);

      if (!user) {
        // Check if user exists with this email
        user = await UserModel.getByEmail(microsoftUserData.email);

        if (!user) {
          // Create a new user with data from Microsoft
          const randomPassword = Array(16)
            .fill(
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*",
            )
            .map((chars) => chars[Math.floor(Math.random() * chars.length)])
            .join("");

          user = await UserModel.create({
            name: microsoftUserData.name,
            email: microsoftUserData.email,
            password: randomPassword, // Random password as it won't be used
            microsoftId: microsoftUserData.sub,
          });

          // Auto-assign user to the "Client" team
          try {
            // Check if user's email is part of the myzone.ai domain (admin users)
            const isMyZoneEmail = user.email.endsWith("@myzone.ai");

            // Determine which team to assign:
            // - If it's a myzone.ai email, MyZone team
            // - Otherwise, Client team
            let defaultTeam = await TeamModel.getByName(
              isMyZoneEmail ? "MyZone" : "Client",
            );

            // Add user to the Default team
            if (defaultTeam) {
              await TeamModel.addUser({
                userId: user.id,
                teamId: defaultTeam.id,
                role: "client",
              });
            }
          } catch (teamError) {
            console.error("Error assigning user to team:", teamError);
            // Continue with user creation even if team assignment fails
          }

          // Check for guest assessments with this email and associate them with the new user
          try {
            await AssessmentModel.assignGuestAssessmentsToUser(user.email, user.id);
          } catch (err) {
            // Just log the error but don't fail registration if this fails
            console.error(
              "Error associating guest assessments with new user:",
              err,
            );
          }
        } else {
          // User exists with this email but not connected to Microsoft yet
          // Connect the Microsoft ID to this user
          user = await UserModel.update(user.id, {
            microsoftId: microsoftUserData.sub,
          });
        }
      }

      // Generate JWT token
      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Failed to authenticate with Microsoft",
        });
      }

      const token = UserModel.generateToken(user);

      // Remove password from response (TypeScript now knows user is defined)
      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Microsoft authentication successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Microsoft authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Microsoft authentication failed due to an unexpected error",
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      // Validate the input
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration data",
          errors: result.error.format(),
        });
      }

      const existingUser = await UserModel.getByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      const user = await UserModel.create(req.body);

      // Auto-assign user to the "Client" team
      try {
        // Check if user's email is part of the myzone.ai domain (admin users)
        const isMyZoneEmail = user.email.endsWith("@myzone.ai");

        // Determine which team to assign:
        // - If it's a myzone.ai email, MyZone team
        // - Otherwise, Client team
        let defaultTeam = await TeamModel.getByName(
          isMyZoneEmail ? "MyZone" : "Client",
        );

        // Add user to the Default team
        if (defaultTeam) {
          await TeamModel.addUser({
            userId: user.id,
            teamId: defaultTeam.id,
            role: "client",
          });
        }
      } catch (teamError) {
        console.error("Error assigning user to team:", teamError);
        // Continue with user creation even if team assignment fails
      }

      // Check for guest assessments with this email and associate them with the new user
      try {
        await AssessmentModel.assignGuestAssessmentsToUser(user.email, user.id);
      } catch (err) {
        // Just log the error but don't fail registration if this fails
        console.error(
          "Error associating guest assessments with new user:",
          err,
        );
      }

      const token = UserModel.generateToken(user);
      const { password, ...userWithoutPassword } = user;

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Registration failed due to an unexpected error",
      });
    }
  }

  static async connectGoogle(req: Request, res: Response) {
    try {
      // Validate the input
      const result = googleConnectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google connect data",
          errors: result.error.format(),
        });
      }

      const userId = req.user!.id;
      const { credential } = req.body;

      // Verify the Google token
      const googleUserData = await UserModel.verifyGoogleToken(credential);
      if (!googleUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token",
        });
      }

      // Check if another user has already connected this Google account
      const existingUser = await UserModel.getByGoogleId(googleUserData.sub);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: "This Google account is already connected to another user",
        });
      }

      // Connect Google account to current user
      const updatedUser = await UserModel.connectGoogleAccount(
        userId,
        googleUserData.sub,
      );

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to connect Google account",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "Google account connected successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Google connect error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to connect Google account",
      });
    }
  }

  static async disconnectGoogle(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Get current user
      const user = await UserModel.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user has Google account connected
      if (!user.googleId) {
        return res.status(400).json({
          success: false,
          message: "No Google account is connected to this user",
        });
      }

      // Disconnect Google account
      const updatedUser = await UserModel.disconnectGoogleAccount(userId);

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to disconnect Google account",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "Google account disconnected successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Google disconnect error:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to disconnect Google account",
      });
    }
  }

  static async connectMicrosoft(req: Request, res: Response) {
    try {
      // Validate the input
      const result = microsoftAuthSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Microsoft connect data",
          errors: result.error.format(),
        });
      }

      const userId = req.user!.id;
      const { credential } = req.body;

      // Verify the Microsoft token
      const microsoftUserData = await UserModel.verifyMicrosoftToken(credential);
      if (!microsoftUserData) {
        return res.status(401).json({
          success: false,
          message: "Invalid Microsoft token",
        });
      }

      // Check if another user has already connected this Microsoft account
      const existingUser = await UserModel.getByMicrosoftId(microsoftUserData.sub);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: "This Microsoft account is already connected to another user",
        });
      }

      // Connect Microsoft account to current user
      const updatedUser = await UserModel.connectMicrosoftAccount(
        userId,
        microsoftUserData.sub,
      );

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to connect Microsoft account",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "Microsoft account connected successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Microsoft connect error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to connect Microsoft account",
      });
    }
  }

  static async disconnectMicrosoft(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Get current user
      const user = await UserModel.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user has Microsoft account connected
      if (!user.microsoftId) {
        return res.status(400).json({
          success: false,
          message: "No Microsoft account is connected to this user",
        });
      }

      // Disconnect Microsoft account
      const updatedUser = await UserModel.disconnectMicrosoftAccount(userId);

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to disconnect Microsoft account",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "Microsoft account disconnected successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Microsoft disconnect error:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to disconnect Microsoft account",
      });
    }
  }
}
