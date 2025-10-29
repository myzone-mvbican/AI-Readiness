import { Request, Response } from "express"; 
import { ApiResponse } from "../utils/apiResponse";
import { TeamService } from "../services/team.service";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../utils/errors";

export class TeamController {

  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validation handled by middleware

      const { team, membership } = await TeamService.createTeam(req.body, userId);
      return ApiResponse.success(res, { team }, 201);
    } catch (error) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to create team");
    }
  }

  static async getTeams(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teams = await TeamService.getUserTeams(userId);

      return ApiResponse.success(res, teams);
    } catch (error) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to retrieve teams");
    }
  }

  // Admin-only: Get all teams with member details
  static async getAll(req: Request, res: Response) {
    try {
      // Parse parameters using service
      const params = TeamService.parsePaginationParams(req);

      const { teams, total, totalPages } = await TeamService.searchTeams(params.search, params.page, params.pageSize);

      return ApiResponse.paginated(res, teams, params.page, params.pageSize, total);
    } catch (error) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to retrieve teams");
    }
  }

  // Admin-only: Update team
  static async update(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      const { name } = req.body; // Already validated by middleware

      const updatedTeam = await TeamService.updateTeam(teamId, { name: name.trim() });
      return ApiResponse.success(res, { team: updatedTeam });
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to update team");
    }
  }

  // Admin-only: Delete team (soft delete)
  static async delete(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      
      await TeamService.deleteTeam(teamId);
      return ApiResponse.success(res, { message: "Team deleted successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to delete team");
    }
  }

  static async restore(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      
      await TeamService.restoreTeam(teamId);
      return ApiResponse.success(res, { message: "Team restored successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to restore team");
    }
  }


  // Admin-only: Remove user from team
  static async removeUser(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);

      await TeamService.removeUserFromTeam(userId, teamId);
      return ApiResponse.success(res, { message: "User removed from team successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to remove user from team");
    }
  }

  // Admin-only: Update user role in team
  static async updateUserRole(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      await TeamService.updateUserRole(userId, teamId, role);
      return ApiResponse.success(res, { message: "User role updated successfully" });
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to update user role");
    }
  }

  // Admin-only: Get team members
  static async getMembers(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      const members = await TeamService.getTeamMembers(teamId);

      return ApiResponse.success(res, members);
    } catch (error) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to retrieve team members");
    }
  }

  // Admin-only: Add user to team
  static async addUser(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const teamId = parseInt(req.params.teamId);

      // req.body is already validated by middleware
      // Add user to team
      const membership = await TeamService.addUserToTeam({
        ...req.body,
        teamId,
      }, userId);

      return ApiResponse.success(res, { membership }, 201);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to add user to team");
    }
  }

  // Admin-only: Update a user's team assignments
  static async updateUserTeams(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;
      const { teamIds } = req.body;

      const result = await TeamService.updateUserTeams(userId, teamIds, loggedInUserId);
      return ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to update user team assignments");
    }
  }

  // Admin-only: Hard delete team (only if soft-deleted and has zero members)
  static async hardDelete(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.id);

      await TeamService.hardDeleteTeam(teamId);
      return ApiResponse.success(res, { message: "Team permanently deleted successfully" });
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to hard delete team");
    }
  }
}
