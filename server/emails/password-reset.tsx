import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  userFirstName?: string;
  resetUrl?: string;
}

const baseUrl = process.env.FRONTEND_URL || "https://myzone-ai-readiness-assessment.replit.app";

export const PasswordResetEmail = ({
  userFirstName = "User",
  resetUrl = "",
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your MyZone AI password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Heading style={h1}>MyZone AI</Heading>
        </Section>
        <Heading style={h2}>Reset Your Password</Heading>
        <Text style={text}>Hello {userFirstName},</Text>
        <Text style={text}>
          We received a request to reset your password for your MyZone AI account. 
          If you didn't make this request, you can safely ignore this email.
        </Text>
        <Text style={text}>
          To reset your password, click the button below:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Your Password
          </Button>
        </Section>
        <Text style={text}>
          Or copy and paste this URL into your browser:{" "}
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
        </Text>
        <Section style={warningBox}>
          <Text style={warningText}>
            <strong>Important:</strong> This reset link will expire in 30 minutes for security reasons. 
            If you need to reset your password after this time, please request a new reset link.
          </Text>
        </Section>
        <Text style={text}>
          If you're having trouble clicking the button, you can also visit our website and use the "Forgot Password" option.
        </Text>
        <Text style={text}>
          Best regards,<br />
          The MyZone AI Team
        </Text>
        <Section style={footer}>
          <Text style={footerText}>
            This is an automated email. Please do not reply to this message.
          </Text>
          <Text style={footerText}>
            If you have questions, please contact our support team.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const logoContainer = {
  padding: "32px 20px",
  textAlign: "center" as const,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const h2 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#667eea",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  margin: "0 auto",
};

const link = {
  color: "#667eea",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const warningBox = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
  borderRadius: "6px",
  margin: "20px 20px",
  padding: "15px",
};

const warningText = {
  color: "#856404",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const footer = {
  borderTop: "1px solid #eaeaea",
  marginTop: "32px",
  paddingTop: "20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "4px 0",
  padding: "0 20px",
};