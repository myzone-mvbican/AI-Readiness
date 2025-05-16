import { Request, Response } from "express";
import { db } from "../db";
import { UserModel } from "../models/user.model";
import { TeamModel } from "../models/team.model";
import { users } from "@shared/schema";
import { updateUserSchema } from "@shared/validation/schemas";

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      // Get basic user information excluding passwords
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          company: users.company,
          employeeCount: users.employeeCount,
          industry: users.industry,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users);

      // For each user, get their teams
      const usersWithTeams = await Promise.all(
        allUsers.map(async (user) => {
          const teams = await TeamModel.getByUserId(user.id);
          return {
            ...user,
            teams: teams,
          };
        }),
      );

      return res.status(200).json({
        success: true,
        users: usersWithTeams,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user list",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;

      // Prevent admins from modifying their own accounts through this endpoint
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot modify your own account through this endpoint. Please use /api/user instead.",
        });
      }

      // Validate data
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid update data",
          errors: result.error.format(),
        });
      }

      // If updating password, hash it first
      let updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await UserModel.hashPassword(updateData.password);
      }

      // Update user
      const updatedUser = await UserModel.update(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;

      // Prevent admins from deleting their own accounts
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own account",
        });
      }

      // Delete user
      try {
        const success = await UserModel.delete(userId);

        if (!success) {
          return res.status(404).json({
            success: false,
            message: "User not found or could not be deleted",
          });
        }

        return res.status(200).json({
          success: true,
          message: "User deleted successfully",
        });
      } catch (err) {
        // Assert that err is an instance of an Error with a 'code' property
        if (err instanceof Error && (err as any).code === "23503") {
          // Foreign key constraint violation
          return res.status(400).json({
            success: false,
            message:
              "User could not be deleted because they still have associated data. Please contact an administrator.",
          });
        }
        throw err; // Re-throw for the outer catch block
      }
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }

  static async exists(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Check if a user with this email exists
      const user = await UserModel.getByEmail(email);

      // Return whether the user exists, without exposing any user data
      res.status(200).json({
        success: true,
        exists: !!user,
      });
    } catch (error) {
      console.error("Error checking user email:", error);
      res.status(500).json({
        success: false,
        message: "Error checking user email",
      });
    }
  }
}
