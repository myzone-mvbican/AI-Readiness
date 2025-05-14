
import { Request, Response } from "express";
import { storage } from "../storage";
import { insertTeamSchema, userTeamSchema } from "@shared/validation/schemas";

export class TeamController {
  static async getUserTeams(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teams = await storage.getTeamsByUserId(userId);

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

  static async createTeam(req: Request, res: Response) {
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
      const team = await storage.createTeam(req.body);

      // Add current user to team as admin
      await storage.addUserToTeam({
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

  static async getAllTeams(req: Request, res: Response) {
    try {
      const { teams } = await import("@shared/schema");
      const { db } = await import("../db");
      
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

  static async addUserToTeam(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teamId = parseInt(req.params.teamId);

      // Validate user is admin of this team
      const userTeams = await storage.getTeamsByUserId(userId);
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
      const userTeam = await storage.addUserToTeam({
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
}
