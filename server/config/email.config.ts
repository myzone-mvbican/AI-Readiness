import nodemailer from "nodemailer";
import { env } from "server/utils/environment";

export function createTransporter() {
  // Fallback to legacy email configuration
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    const port = parseInt(env.SMTP_PORT || "587");
    const secure = port === 465; // Use SSL for port 465, TLS for others

    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: port,
      secure: secure,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Fallback for missing credentials
  throw new Error(
    "Email credentials not configured. Please provide Brevo SMTP environment variables.",
  );
}

export function getEmailFromAddress(): string {
  const fromName = env.MAIL_FROM_NAME || "Keeran AI";
  let fromEmail: string;

  if (env.SMTP_PASS) {
    fromEmail = env.MAIL_FROM || "noreply@myzone.ai";
  } else {
    fromEmail = env.MAIL_FROM || "noreply@myzone.ai";
  }

  return `${fromName} <${fromEmail}>`;
}
