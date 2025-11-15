import { render } from "@react-email/render";
import { PasswordResetEmail } from "../emails/password-reset";
import { GraphEmailService } from "./graph-email.service";
import { env } from "server/utils/environment";

/**
 * Email Service - Sends emails via Microsoft Graph API
 * Replaces previous SMTP/nodemailer implementation
 */
export class EmailService {
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    name: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${env.FRONTEND_URL}/auth/reset?token=${resetToken}`;

      // Render React Email template
      const emailHtml = await render(
        PasswordResetEmail({
          userFirstName: name,
          resetUrl: resetUrl,
        }),
      );

      const emailText = `
Hello ${name},

We received a request to reset your password for your Keeran Networks - AI Readiness Platform account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Keeran Networks Team
      `.trim();

      // Send via Microsoft Graph API
      return await GraphEmailService.sendEmail({
        to: email,
        subject: "Reset Your Keeran Networks - AI Readiness Platform Password",
        html: emailHtml,
        text: emailText,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  }

  // Generic email sending method
  static async sendEmail({
    to,
    subject,
    html,
    text,
    bcc,
    attachments,
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    bcc?: string | string[];
    attachments?: Array<{
      name: string;
      contentType: string;
      contentBytes: string;
    }>;
  }): Promise<boolean> {
    try {
      // Send via Microsoft Graph API
      return await GraphEmailService.sendEmail({
        to,
        subject,
        html,
        text,
        bcc,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      return await GraphEmailService.testConnection();
    } catch (error) {
      console.error("Email connection test failed:", error);
      return false;
    }
  }
}
