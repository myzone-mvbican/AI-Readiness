import { Request, Response } from "express";
import { TeamModel } from "../models/team.model";
import { db } from "../db";
import { teams } from "@shared/schema";
import { insertTeamSchema, userTeamSchema } from "@shared/validation/schemas";

export class TeamController {
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validate team data
      const result = insertTeamSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid team data",
          errors: result.error.format(),
        });
      }

      // Create team
      const team = await TeamModel.create(req.body);

      // Add current user to team as admin
      await TeamModel.addUser({
        userId,
        teamId: team.id,
        role: "admin",
      });

      return res.status(201).json({
        success: true,
        message: "Team created successfully",
        team,
      });
    } catch (error) {
      console.error("Create team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create team",
      });
    }
  }

  static async getTeams(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teams = await TeamModel.getByUserId(userId);

      return res.status(200).json({
        success: true,
        teams,
      });
    } catch (error) {
      console.error("Get teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve teams",
      });
    }
  }

  // Admin-only: Get all teams
  static async getAll(req: Request, res: Response) {
    try {
      const allTeams = await db.select().from(teams);

      return res.status(200).json({
        success: true,
        teams: allTeams,
      });
    } catch (error) {
      console.error("Admin get teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve all teams",
      });
    }
  }

  // Admin-only: Add user to team
  static async addUser(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teamId = parseInt(req.params.teamId);

      // Validate user is admin of this team
      const userTeams = await TeamModel.getByUserId(userId);
      const isAdmin = userTeams.some(
        (team) => team.id === teamId && team.role === "admin",
      );

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add users to this team",
        });
      }

      // Validate data
      const result = userTeamSchema.safeParse({
        ...req.body,
        teamId,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid user team data",
          errors: result.error.format(),
        });
      }

      // Add user to team
      const userTeam = await TeamModel.addUser({
        ...req.body,
        teamId,
      });

      return res.status(201).json({
        success: true,
        message: "User added to team successfully",
        userTeam,
      });
    } catch (error) {
      console.error("Add user to team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add user to team",
      });
    }
  }

  // Admin-only: Update a user's team assignments
  static async updateUserTeams(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;

      // Prevent admins from modifying their own team assignments through this endpoint
      if (userId === loggedInUserId) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot modify your own team assignments through this endpoint",
        });
      }

      const { teamIds } = req.body;

      if (!Array.isArray(teamIds)) {
        return res.status(400).json({
          success: false,
          message: "teamIds must be an array of team IDs",
        });
      }

      // Update user team assignments
      await TeamModel.updateUser(userId, teamIds);

      // Get updated teams for this user
      const updatedTeams = await TeamModel.getByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "User team assignments updated successfully",
        teams: updatedTeams,
      });
    } catch (error) {
      console.error("Update user teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user team assignments",
      });
    }
  }
}
