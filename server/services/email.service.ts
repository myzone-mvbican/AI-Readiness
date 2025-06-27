import { createTransporter } from "../config/email.config";

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
      const resetUrl = `${process.env.FRONTEND_URL || "https://myzone-ai-readiness-assessment.replit.app"}/reset-password?token=${resetToken}`;

      // Use real email service now that credentials are provided
      // For Brevo, we need to use a verified sender email from your account
      let fromEmail;
      if (process.env.BREVO_SMTP_PASSWORD) {
        // Check for verified sender emails in environment or use fallback
        fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'noreply@example.com';
      } else {
        fromEmail = process.env.EMAIL_FROM || "noreply@myzone.ai";
      }
      const mailOptions = {
        from: fromEmail,
        to: email,
        subject: "Reset Your MyZone AI Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              
              <p>We received a request to reset your password for your MyZone AI account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>Important:</strong> This reset link will expire in 30 minutes for security reasons. If you need to reset your password after this time, please request a new reset link.
              </div>
              
              <p>If you're having trouble clicking the button, you can also visit our website and use the "Forgot Password" option.</p>
              
              <p>Best regards,<br>The MyZone AI Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>If you have questions, please contact our support team.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Hello ${name},

We received a request to reset your password for your MyZone AI account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The MyZone AI Team
        `.trim(),
      };

      // Send the actual email using the configured transporter
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);

      console.log("✅ Password reset email sent successfully to:", email);
      console.log("📧 Message ID:", info.messageId);
      console.log("📤 Sent via:", process.env.BREVO_SMTP_PASSWORD ? "Brevo SMTP" : "Legacy SMTP");

      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);

      // Provide helpful error messages for common authentication issues
      if (
        (error as any).code === "EAUTH" &&
        (error as any).response?.includes("BadCredentials")
      ) {
        console.error("\n🔐 EMAIL AUTHENTICATION FAILED:");
        console.error(
          "This usually means you need to use an App Password instead of your regular password.",
        );
        console.error("For Gmail:");
        console.error(
          "1. Enable 2-Factor Authentication on your Google account",
        );
        console.error(
          "2. Generate an App Password: https://myaccount.google.com/apppasswords",
        );
        console.error(
          "3. Use the App Password in EMAIL_PASS instead of your regular password\n",
        );
      }

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

  static async sendTestEmail(email: string): Promise<boolean> {
    try {
      let fromEmail;
      if (process.env.BREVO_SMTP_PASSWORD) {
        fromEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
      } else {
        fromEmail = process.env.EMAIL_FROM || "noreply@myzone.ai";
      }
      const mailOptions = {
        from: fromEmail,
        to: email,
        subject: "MyZone AI - Email Configuration Test",
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your Brevo email configuration is working correctly.</p>
          <p>If you received this email, your email service is properly configured!</p>
          <p>Best regards,<br>MyZone AI Team</p>
        `,
        text: `
MyZone AI - Email Configuration Test

This is a test email to verify that your Brevo email configuration is working correctly.

If you received this email, your email service is properly configured!

Best regards,
MyZone AI Team
        `.trim(),
      };

      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);

      console.log("Test email sent successfully to:", email);
      console.log("Message ID:", info.messageId);

      return true;
    } catch (error) {
      console.error("Error sending test email:", error);
      return false;
    }
  }
}
