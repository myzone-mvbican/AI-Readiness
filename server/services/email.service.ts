import { createTransporter, getEmailFromAddress } from "../config/email.config";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "../emails/password-reset";
import { TestEmail } from "../emails/test-email";

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
      const resetUrl = `${process.env.FRONTEND_URL || "https://ready.myzone.ai/auth"}/reset?token=${resetToken}`;

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
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      // Test Brevo SMTP connection if configured
      if (process.env.BREVO_SMTP_PASSWORD) {
        const transporter = this.getTransporter();
        await transporter.verify();
        console.log("✅ Brevo SMTP connection verified successfully");
        return true;
      }

      // Test legacy email configuration
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = this.getTransporter();
        await transporter.verify();
        console.log("✅ Email SMTP connection verified successfully");
        return true;
      }

      // No email configuration found
      console.warn("⚠️ No email configuration found");
      return false;
    } catch (error) {
      console.error("❌ Email transporter verification failed:", error);
      return false;
    }
  } 
}
