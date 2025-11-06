import { ClientSecretCredential } from "@azure/identity";
import { env } from "../utils/environment";

interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string; // Base64 encoded
  }>;
}

/**
 * Microsoft Graph Email Service
 * Sends emails using Microsoft Graph API with app-only authentication (client credentials)
 */
export class GraphEmailService {
  private static tokenCache: { token: string; expiresAt: number } | null = null;
  private static readonly GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";
  private static readonly GRAPH_SCOPE = "https://graph.microsoft.com/.default";

  /**
   * Get Microsoft Graph access token using client credentials flow
   */
  private static async getAccessToken(): Promise<string> {
    try {
      // Check if we have MS Graph credentials configured
      if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_SECRET) {
        throw new Error("Microsoft Graph credentials not configured");
      }

      // Check if cached token is still valid (with 5 minute buffer)
      const now = Date.now();
      if (this.tokenCache && this.tokenCache.expiresAt > now + 5 * 60 * 1000) {
        return this.tokenCache.token;
      }

      // Create credential using client secret
      const credential = new ClientSecretCredential(
        env.MS_TENANT_ID,
        env.MS_CLIENT_ID,
        env.MS_SECRET
      );

      // Get token for Microsoft Graph
      const tokenResponse = await credential.getToken(this.GRAPH_SCOPE);
      
      if (!tokenResponse || !tokenResponse.token) {
        throw new Error("Failed to obtain access token");
      }

      // Cache the token with expiration
      this.tokenCache = {
        token: tokenResponse.token,
        expiresAt: tokenResponse.expiresOnTimestamp,
      };

      return tokenResponse.token;
    } catch (error) {
      console.error("Error getting Microsoft Graph access token:", error);
      throw new Error("Failed to authenticate with Microsoft Graph");
    }
  }

  /**
   * Send email via Microsoft Graph API
   */
  static async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      if (!env.MS_SENDER_EMAIL) {
        throw new Error("MS_SENDER_EMAIL not configured");
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Build email message in Graph API format
      const emailBody: any = {
        message: {
          subject: message.subject,
          body: {
            contentType: message.html ? "HTML" : "Text",
            content: message.html || message.text || "",
          },
          from: {
            emailAddress: {
              name: "Keeran AI",
              address: env.MS_SENDER_EMAIL,
            },
          },
          toRecipients: [
            {
              emailAddress: {
                address: message.to,
              },
            },
          ],
        },
        saveToSentItems: false, // Don't save to sent items to avoid clutter
      };

      // Add attachments if provided
      if (message.attachments && message.attachments.length > 0) {
        emailBody.message.attachments = message.attachments.map((attachment) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: attachment.name,
          contentType: attachment.contentType,
          contentBytes: attachment.contentBytes,
        }));
      }

      // Send email via Graph API
      const response = await fetch(
        `${this.GRAPH_ENDPOINT}/users/${env.MS_SENDER_EMAIL}/sendMail`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Graph API error:", response.status, errorText);
        throw new Error(`Failed to send email via Graph API: ${response.status}`);
      }

      console.log(`Email sent successfully to ${message.to}`);
      return true;
    } catch (error) {
      console.error("Error sending email via Microsoft Graph:", error);
      return false;
    }
  }

  /**
   * Test connection to Microsoft Graph
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_SECRET || !env.MS_SENDER_EMAIL) {
        console.log("Microsoft Graph credentials not fully configured");
        return false;
      }

      // Try to get a token
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      console.error("Microsoft Graph connection test failed:", error);
      return false;
    }
  }
}
