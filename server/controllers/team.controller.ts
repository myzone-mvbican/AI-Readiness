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

  // Admin-only: Get all teams with member details
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const allTeams = await TeamModel.getAllWithMembers();
      
      // Filter teams by search if provided
      let filteredTeams = allTeams;
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        filteredTeams = allTeams.filter(team => 
          team.name.toLowerCase().includes(searchLower) ||
          team.members.some(member => 
            member.name.toLowerCase().includes(searchLower) ||
            member.email.toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination
      const total = filteredTeams.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedTeams = filteredTeams.slice(offset, offset + limit);

      return res.status(200).json({
        success: true,
        teams: paginatedTeams,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      });
    } catch (error) {
      console.error("Admin get teams error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve teams",
      });
    }
  }

  // Admin-only: Update team
  static async update(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Team name is required",
        });
      }

      const updatedTeam = await TeamModel.update(teamId, { name: name.trim() });

      if (!updatedTeam) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Team updated successfully",
        team: updatedTeam,
      });
    } catch (error) {
      console.error("Update team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update team",
      });
    }
  }

  // Admin-only: Delete team (soft delete)
  static async delete(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      
      const success = await TeamModel.softDelete(teamId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Team deleted successfully",
      });
    } catch (error) {
      console.error("Delete team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete team",
      });
    }
  }

  // Admin-only: Restore team
  static async restore(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      
      const success = await TeamModel.restoreTeam(teamId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Team restored successfully",
      });
    } catch (error) {
      console.error("Restore team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to restore team",
      });
    }
  }

  // Admin-only: Remove user from team
  static async removeUser(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);

      const success = await TeamModel.removeUser(userId, teamId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "User not found in team",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User removed from team successfully",
      });
    } catch (error) {
      console.error("Remove user from team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove user from team",
      });
    }
  }

  // Admin-only: Update user role in team
  static async updateUserRole(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      if (!["admin", "member"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'admin' or 'member'",
        });
      }

      const success = await TeamModel.updateUserRole(userId, teamId, role);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "User not found in team",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User role updated successfully",
      });
    } catch (error) {
      console.error("Update user role error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user role",
      });
    }
  }

  // Admin-only: Get team members
  static async getMembers(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      const members = await TeamModel.getTeamMembers(teamId);

      return res.status(200).json({
        success: true,
        members,
      });
    } catch (error) {
      console.error("Get team members error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve team members",
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

  // Admin-only: Hard delete team (only if soft-deleted and has zero members)
  static async hardDelete(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);

      // Check if team can be hard deleted
      const { canDelete, reason } = await TeamModel.canHardDelete(teamId);
      
      if (!canDelete) {
        return res.status(400).json({
          success: false,
          message: reason || "Team cannot be hard deleted",
        });
      }

      const success = await TeamModel.hardDelete(teamId);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: "Failed to hard delete team",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Team permanently deleted successfully",
      });
    } catch (error) {
      console.error("Hard delete team error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to hard delete team",
      });
    }
  }
}
