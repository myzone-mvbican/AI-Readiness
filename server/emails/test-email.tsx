import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TestEmailProps {
  recipientEmail?: string;
}

export const TestEmail = ({
  recipientEmail = "user@example.com",
}: TestEmailProps) => (
  <Html>
    <Head />
    <Preview>MyZone AI - Email Configuration Test</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Heading style={h1}>MyZone AI</Heading>
        </Section>
        <Heading style={h2}>Email Configuration Test</Heading>
        <Text style={text}>
          This is a test email to verify that your Brevo email configuration is working correctly.
        </Text>
        <Text style={text}>
          If you received this email at <strong>{recipientEmail}</strong>, your email service is properly configured!
        </Text>
        <Section style={successBox}>
          <Text style={successText}>
            ✅ Email delivery successful<br />
            ✅ SMTP connection verified<br />
            ✅ Sender authentication working
          </Text>
        </Section>
        <Text style={text}>
          Best regards,<br />
          MyZone AI Team
        </Text>
        <Section style={footer}>
          <Text style={footerText}>
            This is an automated test email from your MyZone AI application.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TestEmail;

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

const successBox = {
  backgroundColor: "#d4edda",
  border: "1px solid #c3e6cb",
  borderRadius: "6px",
  margin: "20px 20px",
  padding: "15px",
};

const successText = {
  color: "#155724",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
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