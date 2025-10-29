import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AssessmentCompleteEmailProps {
  recipientName?: string;
  recipientEmail?: string;
  downloadUrl?: string;
  companyName?: string;
}

export const AssessmentCompleteEmail = ({
  recipientName = "Valued User",
  recipientEmail = "user@example.com",
  downloadUrl = "#",
  companyName = "your organization",
}: AssessmentCompleteEmailProps) => (
  <Html>
    <Head />
    <Preview>Your MyZone AI Readiness Assessment Results Are Ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Heading style={h1}>MyZone AI</Heading>
        </Section>

        <Heading style={h2}>Your AI Readiness Assessment is Complete!</Heading>

        <Text style={text}>Hello {recipientName},</Text>

        <Text style={text}>
          Great news! We've completed the analysis of {companyName}'s AI
          readiness assessment and generated your personalized recommendations
          report.
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>
            🎯 Your comprehensive AI readiness report includes:
          </Text>
          <Text style={bulletText}>
            • Detailed analysis of your AI readiness across 8 key pillars
            <br />
            • Personalized recommendations powered by AI
            <br />
            • Visual radar chart showing your strengths and opportunities
            <br />• Actionable next steps for AI implementation
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={downloadUrl}>
            Download Report
          </Button>
        </Section>

        <Text style={text}>
          Your report contains valuable insights to help guide your
          organization's AI transformation journey. We recommend sharing these
          findings with your leadership team and using them to develop your AI
          strategy.
        </Text>

        <Text style={text}>
          If you have any questions about your results or need assistance
          interpreting the recommendations, our team is here to help.
        </Text>

        <Text style={text}>
          Best regards,
          <br />
          The MyZone AI Team
        </Text>

        <Section style={footer}>
          <Text style={footerText}>
            This assessment was completed for {recipientEmail}. If you believe
            you received this email in error, please contact our support team.
          </Text>
          <Text style={footerText}>
            © 2025 MyZone AI. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default AssessmentCompleteEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 20px",
  marginBottom: "64px",
};

const logoContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const h1 = {
  color: "#1d4ed8",
  fontSize: "36px",
  fontWeight: "700",
  margin: "30px 0",
  padding: "0",
  lineHeight: "42px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1a202c",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "left" as const,
  margin: "16px 32px",
};

const highlightBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  margin: "24px 32px",
  padding: "20px",
  maxWidth: "536px",
};

const highlightText = {
  color: "#1a202c",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px 0",
};

const bulletText = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1d4ed8",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "0 auto",
  lineHeight: "24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "48px 32px 0",
  textAlign: "center" as const,
};

const footerText = {
  margin: "8px 0",
};
