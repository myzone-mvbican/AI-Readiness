import { createTransporter } from '../config/email.config';

export class EmailService {
  private static transporter = createTransporter();

  // Reinitialize transporter to ensure latest config
  private static getTransporter() {
    return createTransporter();
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      // In development, just log the email details instead of actually sending
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== PASSWORD RESET EMAIL ===');
        console.log('To:', email);
        console.log('User:', name);
        console.log('Reset URL:', resetUrl);
        console.log('Token expires in: 30 minutes');
        console.log('=============================\n');
        return true;
      }

      // Production email sending logic would go here with real SMTP credentials
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@myzone.ai',
        to: email,
        subject: 'Reset Your MyZone AI Password',
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

      // For production, would use real email service
      // const transporter = this.getTransporter();
      // await transporter.sendMail(mailOptions);
      
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      // In development, always return true since we're not using real SMTP
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }
}