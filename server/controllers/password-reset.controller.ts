import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { EmailService } from "../services/email.service";
import { passwordResetRequestSchema, passwordResetConfirmSchema } from "@shared/types/auth";

export class PasswordResetController {
  static async requestReset(req: Request, res: Response) {
    try {
      const result = passwordResetRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
          errors: result.error.format(),
        });
      }

      const { email } = result.data;
      
      // Generate reset token
      const resetToken = await UserModel.generateResetToken(email);
      
      if (!resetToken) {
        // Don't reveal if email exists for security
        return res.status(200).json({
          success: true,
          message: "If an account with that email exists, you will receive a password reset link shortly.",
        });
      }

      // Get user details for email
      const user = await UserModel.getByEmail(email);
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account with that email exists, you will receive a password reset link shortly.",
        });
      }

      // Send reset email
      const emailSent = await EmailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.name
      );

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send reset email. Please try again later.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, you will receive a password reset link shortly.",
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  }

  static async confirmReset(req: Request, res: Response) {
    try {
      const result = passwordResetConfirmSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset data",
          errors: result.error.format(),
        });
      }

      const { token, password } = result.data;

      // Validate token and reset password
      const success = await UserModel.resetPassword(token, password);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token. Please request a new password reset.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Password reset confirmation error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  }

  static async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Reset token is required",
        });
      }

      const user = await UserModel.validateResetToken(token);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token is valid",
        data: { email: user.email }, // Return email for display purposes
      });
    } catch (error) {
      console.error("Token validation error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
}