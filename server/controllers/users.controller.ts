
import { Request, Response } from "express";
import { db } from "../db";
import { UsersModel } from "../models/users.model";
import { users } from "@shared/schema";

export class UsersController {
  static async getAllUsers(req: Request, res: Response) {
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
          const teams = await UsersModel.getUserTeams(user.id);
          return {
            ...user,
            teams,
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

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const updatedUser = await UsersModel.update(userId, req.body);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

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

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const success = await UsersModel.delete(userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
}
