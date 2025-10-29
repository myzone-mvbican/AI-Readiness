import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { AuthService } from "../services/auth.service";
import { ValidationError } from "../utils/errors";

/**
 * PasswordResetController - Handles password reset operations
 * Uses AuthService for business logic
 */
export class PasswordResetController {
  private static authService = new AuthService();

  /**
   * Request password reset
   * POST /api/password/reset-request
   */
  static async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body; // Already validated by middleware

      // Use AuthService to handle password reset request
      await PasswordResetController.authService.requestPasswordReset(email);

      // Always return success for security (don't reveal if user exists)
      return ApiResponse.success(res, { 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to process password reset request");
    }
  }

  /**
   * Confirm password reset with token
   * POST /api/password/reset-confirm
   */
  static async confirmReset(req: Request, res: Response) {
    try {
      const { token, password } = req.body; // Already validated by middleware

      // Use AuthService to confirm password reset
      await PasswordResetController.authService.confirmPasswordReset(token, password);

      return ApiResponse.success(res, { 
        message: "Password has been reset successfully. You can now log in with your new password." 
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      return ApiResponse.internalError(res, "Failed to reset password");
    }
  }

  /**
   * Validate reset token
   * GET /api/password/validate-token
   */
  static async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.query; // Already validated by middleware

      // Use AuthService to validate token
      const isValid = await PasswordResetController.authService.validateResetToken(token as string);

      return ApiResponse.success(res, { valid: isValid });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to validate token");
    }
  }

}