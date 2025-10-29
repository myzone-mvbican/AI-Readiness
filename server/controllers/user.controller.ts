import { Request, Response } from "express";
import { UserService } from "server/services/user.service"; 
import { ApiResponse } from "server/utils/apiResponse";
import { PasswordSecurityService } from "server/services/password-security.service";

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      // Parse and validate parameters using service
      const { params, error } = UserService.parsePaginationParams(req);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Get paginated users using the service
      const result = await UserService.getAll(params);

      return ApiResponse.paginated(res, result.users, params.page, params.limit, result.pagination.total);
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to retrieve user list");
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;

      // Prevent admins from modifying their own accounts through this endpoint
      if (userId === loggedInUserId) {
        return ApiResponse.forbidden(res, "You cannot modify your own account through this endpoint. Please use /api/user instead.");
      }

      // If updating password, hash it first
      let updateData = { ...req.body }; // Already validated by middleware
      if (updateData.password) {
        updateData.password = await PasswordSecurityService.hashPassword(updateData.password);
      }

      // Update user
      const updatedUser = await UserService.update(userId, updateData);

      if (!updatedUser) {
        return ApiResponse.notFound(res, "User not found");
      }

      // Sanitize user data - remove all sensitive fields
      const { 
        password, 
        passwordHistory, 
        resetToken, 
        resetTokenExpiry, 
        failedLoginAttempts, 
        accountLockedUntil,
        ...safeUser 
      } = updatedUser;

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to update user");
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.user!.id;

      // Prevent admins from deleting their own accounts
      if (userId === loggedInUserId) {
        return ApiResponse.forbidden(res, "You cannot delete your own account");
      }

      // Delete user
      try {
        const success = await UserService.delete(userId);

        if (!success) {
          return ApiResponse.notFound(res, "User not found or could not be deleted");
        }

        return ApiResponse.success(res, { message: "User deleted successfully" });
      } catch (err) {
        // Assert that err is an instance of an Error with a 'code' property
        if (err instanceof Error && (err as any).code === "23503") {
          // Foreign key constraint violation
          return ApiResponse.validationError(res, "User could not be deleted because they still have associated data. Please contact an administrator.");
        }
        throw err; // Re-throw for the outer catch block
      }
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to delete user");
    }
  }

  static async exists(req: Request, res: Response) {
    try {
      const { email } = req.query; // Already validated by middleware

      // Check if a user with this email exists
      const user = await UserService.getByEmail(email as string);

      // Return whether the user exists, without exposing any user data
      return ApiResponse.success(res, { exists: !!user });
    } catch (error) {
      return ApiResponse.internalError(res, "Error checking user email");
    }
  }

  static async searchUsers(req: Request, res: Response) {
    try {
      const { q } = req.query; // Already validated by middleware

      // If no search term provided, return empty array
      if (!q) {
        return ApiResponse.success(res, { users: [] });
      }

      const searchTerm = (q as string).trim();

      // Search users by name or email
      const users = await UserService.searchByNameOrEmail(searchTerm);

      return ApiResponse.success(res, users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })));
    } catch (error) {
      return ApiResponse.internalError(res, "Error searching users");
    }
  }

  static async getUserAssessments(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(Number(userId))) {
        return ApiResponse.validationError(res, "Valid user ID is required");
      }

      // Check if user exists
      const user = await UserService.getById(Number(userId));
      if (!user) {
        return ApiResponse.notFound(res, "User not found");
      }

      // Get user's assessments
      const assessments = await UserService.getUserAssessments(Number(userId));

      return ApiResponse.success(res, assessments.map(assessment => ({
        id: assessment.id,
        surveyId: assessment.surveyId,
        completedAt: assessment.completedAt,
        createdAt: assessment.createdAt,
      })));
    } catch (error) {
      return ApiResponse.internalError(res, "Error fetching user assessments");
    }
  }
}
