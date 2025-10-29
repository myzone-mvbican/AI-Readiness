import { render } from "@react-email/render"; 
import { createTransporter, getEmailFromAddress } from "../config/email.config";
import { PasswordResetEmail } from "../emails/password-reset"; 
import { env } from "server/utils/environment";

export class EmailService {
  private static transporter = createTransporter();

  // Reinitialize transporter to ensure latest config
  private static getTransporter() {
    return createTransporter();
  }

  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    name: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${env.FRONTEND_URL}/auth/reset?token=${resetToken}`;

      // Get formatted from address with name
      const fromAddress = getEmailFromAddress();

      // Render React Email template
      const emailHtml = await render(PasswordResetEmail({
        userFirstName: name,
        resetUrl: resetUrl
      }));

      const emailText = `
Hello ${name},

We received a request to reset your password for your MyZone AI account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The MyZone AI Team
      `.trim();

      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: "Reset Your MyZone AI Password",
        html: emailHtml,
        text: emailText,
      };

      // Send the actual email using the configured transporter
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions); 
      
      return true;
    } catch (error) {  
      console.error("Failed to send email:", error);
      return false;
    }
  }

  // Generic email sending method
  static async sendEmail({
    to,
    subject,
    html,
    text
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<boolean> {
    try {
      // Get formatted from address with name
      const fromAddress = getEmailFromAddress();

      const mailOptions = {
        from: fromAddress,
        to: to,
        subject: subject,
        html: html,
        text: text,
      };

      // Send the actual email using the configured transporter
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);

      return true;
    } catch (error) {
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      // Test Brevo SMTP connection if configured
      if (env.SMTP_PASS) {
        const transporter = this.getTransporter();
        await transporter.verify();
        return true;
      }

      // Test legacy email configuration
      if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        const transporter = this.getTransporter();
        await transporter.verify();
        return true;
      }

      // No email configuration found
      return false;
    } catch (error) {
      return false;
    }
  } 
}
