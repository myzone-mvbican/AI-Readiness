import { TeamRepository } from "../repositories/team.repository";
import { Team, TeamWithRole, UserTeam, User } from "@shared/types";
import { InsertTeam, InsertUserTeam, UpdateTeam } from "@shared/types/requests";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
} from "../utils/errors";

/**
 * TeamService - Business logic for team operations
 * Extracted from TeamController to follow service layer pattern
 */
export class TeamService {
  /**
   * Parse and validate pagination parameters from request
   */
  static parsePaginationParams(req: any): {
    page: number;
    pageSize: number;
    search: string;
  } {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    return {
      page,
      pageSize,
      search,
    };
  }

  /**
   * Get team by name
   */
  static async getByName(name: string): Promise<any> {
    try {
      return await TeamRepository.getByName(name);
    } catch (error) {
      throw new InternalServerError("Failed to get team by name");
    }
  }

  /**
   * Get teams by user ID
   */
  static async getByUserId(userId: number): Promise<any[]> {
    try {
      return await TeamRepository.getByUserId(userId);
    } catch (error) {
      throw new InternalServerError("Failed to get teams by user ID");
    }
  }

  /**
   * Create a new team with admin assignment
   */
  static async createTeam(teamData: InsertTeam, creatorId: number): Promise<{ team: Team; membership: UserTeam }> {
    try {
      // Create team
      const team = await TeamRepository.create(teamData);

      // Add creator as admin
      const membership = await TeamRepository.addUser({
        userId: creatorId,
        teamId: team.id,
        role: "admin",
      });

      return { team, membership };
    } catch (error) {
      throw new InternalServerError("Failed to create team");
    }
  }

  /**
   * Get teams for a user
   */
  static async getUserTeams(userId: number): Promise<TeamWithRole[]> {
    try {
      return await TeamRepository.getByUserId(userId);
    } catch (error) {
      throw new InternalServerError("Failed to retrieve user teams");
    }
  }

  /**
   * Get all teams with members (admin only)
   */
  static async getAllTeamsWithMembers(): Promise<Array<Team & { memberCount: number; members: Array<User & { role: string }> }>> {
    try {
      return await TeamRepository.getAllWithMembers();
    } catch (error) {
      throw new InternalServerError("Failed to retrieve teams");
    }
  }

  /**
   * Search and filter teams with pagination
   */
  static async searchTeams(
    searchTerm: string,
    page: number,
    pageSize: number
  ): Promise<{
    teams: Array<Team & { memberCount: number; members: Array<User & { role: string }> }>;
    total: number;
    totalPages: number;
  }> {
    try {
      // Get all teams with members
      const allTeams = await TeamRepository.getAllWithMembers();
      
      // Filter teams by search if provided (case-insensitive)
      let filteredTeams = allTeams;
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredTeams = allTeams.filter(team => 
          team.name.toLowerCase().includes(searchLower) ||
          team.members.some((member: any) => 
            member.name.toLowerCase().includes(searchLower) ||
            member.email.toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination
      const total = filteredTeams.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const paginatedTeams = filteredTeams.slice(offset, offset + pageSize);

      return {
        teams: paginatedTeams,
        total,
        totalPages,
      };
    } catch (error) {
      throw new InternalServerError("Failed to search teams");
    }
  }

  /**
   * Update team details
   */
  static async updateTeam(teamId: number, teamData: UpdateTeam): Promise<Team> {
    try {
      const updatedTeam = await TeamRepository.update(teamId, teamData);

      if (!updatedTeam) {
        throw new NotFoundError("Team");
      }

      return updatedTeam;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to update team");
    }
  }

  /**
   * Delete team (soft delete)
   */
  static async deleteTeam(teamId: number): Promise<void> {
    try {
      const success = await TeamRepository.softDelete(teamId);

      if (!success) {
        throw new NotFoundError("Team");
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to delete team");
    }
  }

  /**
   * Restore a soft-deleted team
   */
  static async restoreTeam(teamId: number): Promise<void> {
    try {
      const success = await TeamRepository.restore(teamId);

      if (!success) {
        throw new NotFoundError("Team");
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to restore team");
    }
  }

  /**
   * Hard delete team (permanent deletion)
   */
  static async hardDeleteTeam(teamId: number): Promise<void> {
    try {
      // Check if team can be hard deleted
      const { canDelete, reason } = await TeamRepository.canHardDelete(teamId);
      
      if (!canDelete) {
        throw new ValidationError(reason || "Team cannot be hard deleted");
      }

      const success = await TeamRepository.hardDelete(teamId);

      if (!success) {
        throw new InternalServerError("Failed to hard delete team");
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError("Failed to hard delete team");
    }
  }

  /**
   * Add user to team
   */
  static async addUserToTeam(
    userTeamData: InsertUserTeam,
    requesterId: number
  ): Promise<UserTeam> {
    try {
      // Validate requester is admin of the team
      const userTeams = await TeamRepository.getByUserId(requesterId);
      const isAdmin = userTeams.some(
        (team) => team.id === userTeamData.teamId && team.role === "admin"
      );

      if (!isAdmin) {
        throw new ForbiddenError("You don't have permission to add users to this team");
      }

      // Add user to team
      const membership = await TeamRepository.addUser(userTeamData);
      return membership;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError("Failed to add user to team");
    }
  }

  /**
   * Remove user from team
   */
  static async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    try {
      const success = await TeamRepository.removeUser(userId, teamId);

      if (!success) {
        throw new NotFoundError("User not found in team");
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to remove user from team");
    }
  }

  /**
   * Update user role in team
   */
  static async updateUserRole(userId: number, teamId: number, role: string): Promise<void> {
    try {
      // Validate role
      if (!["admin", "member"].includes(role)) {
        throw new ValidationError("Invalid role. Must be 'admin' or 'member'");
      }

      const success = await TeamRepository.updateUserRole(userId, teamId, role);

      if (!success) {
        throw new NotFoundError("User not found in team");
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to update user role");
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: number): Promise<Array<User & { role: string }>> {
    try {
      return await TeamRepository.getTeamMembers(teamId);
    } catch (error) {
      throw new InternalServerError("Failed to retrieve team members");
    }
  }

  /**
   * Update user's team assignments
   */
  static async updateUserTeams(
    userId: number,
    teamIds: number[],
    requesterId: number
  ): Promise<{ user: { id: number }; teams: TeamWithRole[] }> {
    try {
      // Prevent admins from modifying their own team assignments
      if (userId === requesterId) {
        throw new ForbiddenError("You cannot modify your own team assignments through this endpoint");
      }

      // Validate teamIds is an array
      if (!Array.isArray(teamIds)) {
        throw new ValidationError("teamIds must be an array of team IDs");
      }

      // Update user team assignments
      await TeamRepository.updateUser(userId, teamIds);

      // Get updated teams for this user
      const updatedTeams = await TeamRepository.getByUserId(userId);

      return { user: { id: userId }, teams: updatedTeams };
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError("Failed to update user team assignments");
    }
  }

  /**
   * Validate team name
   */
  private validateTeamName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError("Team name is required");
    }
  }

  /**
   * Validate user team data
   */
  private validateUserTeamData(data: InsertUserTeam): void {
    if (!data.userId || !data.teamId || !data.role) {
      throw new ValidationError("User ID, Team ID, and role are required");
    }

    if (!["admin", "member"].includes(data.role)) {
      throw new ValidationError("Invalid role. Must be 'admin' or 'member'");
    }
  }
}
