import nodemailer from "nodemailer";

export function createTransporter() {
  // Fallback to legacy email configuration
  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const secure = port === 465; // Use SSL for port 465, TLS for others

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
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
  const fromName = process.env.EMAIL_FROM_NAME || "Keeran Networks AI";
  let fromEmail: string;

  if (process.env.BREVO_SMTP_PASSWORD) {
    fromEmail = process.env.BREVO_SENDER_EMAIL || "noreply@myzone.ai";
  } else {
    fromEmail = process.env.EMAIL_FROM || "noreply@myzone.ai";
  }

  return `${fromName} <${fromEmail}>`;
}
