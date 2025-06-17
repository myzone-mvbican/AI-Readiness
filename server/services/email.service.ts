import nodemailer from 'nodemailer';
import { createTransporter } from '../config/email.config';

export class EmailService {
  private static transporter = createTransporter();

  static async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth/reset?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@myzone.ai',
        to: email,
        subject: 'Password Reset - MyZone AI Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>You have requested to reset your password for your MyZone AI account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 30 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">This is an automated message from MyZone AI Platform. Please do not reply to this email.</p>
          </div>
        `,
        text: `
Hello ${name},

You have requested to reset your password for your MyZone AI account.

Please visit the following link to reset your password:
${resetUrl}

This link will expire in 30 minutes.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

MyZone AI Platform
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}