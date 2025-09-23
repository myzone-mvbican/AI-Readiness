import { db } from "../db";
import { eq, or, ilike, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { User, GoogleUserPayload } from "@shared/types";
import { users, userTeams, surveys, assessments } from "@shared/schema";
import { InsertUser, UpdateUser } from "@shared/types/requests";

// Create a JWT_SECRET if not already set
if (!process.env.JWT_SECRET) {
  console.error(
    "CRITICAL: JWT_SECRET environment variable is required but not set. Application cannot start securely without it.",
  );
  process.exit(1);
}

// List of admin emails (environment variable based for security, with defaults)
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "bican.valeriu@myzone.ai,mike@myzone.ai"
)
  .split(",")
  .map((email) => email.trim().toLowerCase());

export class UserModel {
  static async getById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  static async getByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  static async getByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId));
      return user;
    } catch (error) {
      console.error("Error getting user by Google ID:", error);
      return undefined;
    }
  }

  static async getByMicrosoftId(microsoftId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.microsoftId, microsoftId));
      return user;
    } catch (error) {
      console.error("Error getting user by Microsoft ID:", error);
      return undefined;
    }
  }

  static async create(userData: InsertUser): Promise<User> {
    try {
      // Hash the password if provided
      let userWithHashedPwd = { ...userData };
      if (userData.password) {
        userWithHashedPwd.password = await UserModel.hashPassword(
          userData.password,
        );
      }

      // Lowercase the email to ensure consistency
      if (userWithHashedPwd.email) {
        userWithHashedPwd.email = userWithHashedPwd.email.toLowerCase();
      }

      // Insert user into database
      const [user] = await db
        .insert(users)
        .values(userWithHashedPwd)
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async update(
    id: number,
    userData: UpdateUser,
  ): Promise<User | undefined> {
    try {
      // If a new password is provided, hash it
      let updatedUserData = { ...userData };
      if (userData.password) {
        updatedUserData.password = await UserModel.hashPassword(
          userData.password,
        );
      }

      // Update user in database
      const [user] = await db
        .update(users)
        .set(updatedUserData)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      // First, delete all team associations for this user
      await db.delete(userTeams).where(eq(userTeams.userId, id));

      // Then, delete any surveys created by this user (or set them to a default user)
      // This depends on your business logic - here we'll delete them
      await db.delete(surveys).where(eq(surveys.authorId, id));

      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));

      return !!result;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error; // Rethrow to handle at the route level
    }
  }

  static async connectGoogleAccount(
    userId: number,
    googleId: string,
  ): Promise<User | undefined> {
    try {
      return UserModel.update(userId, { googleId });
    } catch (error) {
      console.error("Error connecting Google account:", error);
      throw error;
    }
  }

  static async disconnectGoogleAccount(
    userId: number,
  ): Promise<User | undefined> {
    try {
      // First get the current user
      const user = await UserModel.getById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Ensure the user has a password before disconnecting Google
      if (!user.password) {
        throw new Error(
          "Cannot disconnect Google account without a password set",
        );
      }

      // Update the user to remove Google ID
      return UserModel.update(userId, { googleId: null });
    } catch (error) {
      console.error("Error disconnecting Google account:", error);
      throw error;
    }
  }

  static async connectMicrosoftAccount(
    userId: number,
    microsoftId: string,
  ): Promise<User | undefined> {
    try {
      return UserModel.update(userId, { microsoftId });
    } catch (error) {
      console.error("Error connecting Microsoft account:", error);
      throw error;
    }
  }

  static async disconnectMicrosoftAccount(
    userId: number,
  ): Promise<User | undefined> {
    try {
      // First get the current user
      const user = await UserModel.getById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Ensure the user has a password before disconnecting Microsoft
      if (!user.password) {
        throw new Error(
          "Cannot disconnect Microsoft account without a password set",
        );
      }

      // Update the user to remove Microsoft ID
      return UserModel.update(userId, { microsoftId: null });
    } catch (error) {
      console.error("Error disconnecting Microsoft account:", error);
      throw error;
    }
  }

  static async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyGoogleToken(
    token: string,
  ): Promise<GoogleUserPayload | null> {
    try {
      // Get the Google Client ID from environment
      const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error("Google Client ID not configured");
        return null;
      }

      // Create OAuth2Client and verify the token
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        console.error("No payload in Google token");
        return null;
      }

      // Return the payload in the expected format
      return {
        sub: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        email_verified: payload.email_verified || false,
      } as GoogleUserPayload;
    } catch (error) {
      console.error("Error verifying Google token:", error);
      return null;
    }
  }

  static async verifyMicrosoftToken(
    token: string,
  ): Promise<GoogleUserPayload | null> {
    try {
      // Get the Microsoft Client ID from environment
      const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
      if (!microsoftClientId) {
        console.error("Microsoft Client ID not configured");
        return null;
      }

      // Decode token without verification to extract issuer and kid
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Invalid JWT format");
        return null;
      }

      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      
      const issuer = payload.iss;
      const kid = header.kid;
      
      if (!issuer) {
        console.error("No issuer found in token");
        return null;
      }

      // Fetch OIDC metadata to get the correct JWKS URI
      const metadataUrl = `${issuer}/.well-known/openid-configuration`;
      
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        console.error("Failed to fetch OIDC metadata:", metadataResponse.statusText);
        return null;
      }
      
      const metadata = await metadataResponse.json();
      const jwksUri = metadata.jwks_uri;
      
      if (!jwksUri) {
        console.error("No jwks_uri found in OIDC metadata");
        return null;
      }


      // Import jose and create RemoteJWKSet with the issuer-specific JWKS endpoint
      const { jwtVerify, createRemoteJWKSet } = await import('jose');
      const JWKS = createRemoteJWKSet(new URL(jwksUri));

      // Verify the JWT token with proper issuer and audience validation
      const { payload: verifiedPayload } = await jwtVerify(token, JWKS, {
        issuer: issuer, // Use exact issuer from token
        audience: microsoftClientId,
        clockTolerance: '60s'
      });


      // Extract user information from validated payload
      const microsoftId = verifiedPayload.sub || verifiedPayload.oid as string;
      const email = verifiedPayload.email as string || verifiedPayload.preferred_username as string || '';
      const name = verifiedPayload.name as string || '';

      // Ensure we have required fields
      if (!microsoftId) {
        console.error("Missing user ID (sub/oid) in Microsoft token");
        return null;
      }

      if (!email) {
        console.error("Missing email in Microsoft token");
        return null;
      }


      // Return the payload in the expected format (same as Google)
      return {
        sub: microsoftId,
        email: email.toLowerCase(),
        name: name,
        picture: '',
        email_verified: verifiedPayload.email_verified !== false,
      } as GoogleUserPayload;

    } catch (error) {
      console.error("Error verifying Microsoft token:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  static generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role || "client",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
  }

  static verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
        role?: string;
      };
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }

  static isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }

  // Password reset methods
  static async generateResetToken(email: string): Promise<string | null> {
    try {
      const user = await this.getByEmail(email);
      if (!user) return null;

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      await db
        .update(users)
        .set({ 
          resetToken: token, 
          resetTokenExpiry: expiry,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      return token;
    } catch (error) {
      console.error("Error generating reset token:", error);
      return null;
    }
  }

  static async validateResetToken(token: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token));

      if (!user || !user.resetTokenExpiry) return null;

      // Check if token is expired
      if (new Date() > user.resetTokenExpiry) {
        // Clean up expired token
        await this.clearResetToken(user.id);
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error validating reset token:", error);
      return null;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.validateResetToken(token);
      if (!user) return false;

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }

  static async clearResetToken(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          resetToken: null, 
          resetTokenExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error clearing reset token:", error);
    }
  }

  static async searchByNameOrEmail(searchTerm: string): Promise<User[]> {
    try {
      const searchPattern = `%${searchTerm.trim()}%`;
      const result = await db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.name, searchPattern),
            ilike(users.email, searchPattern)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(10);
      
      return result;
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  static async getUserAssessments(userId: number): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(assessments)
        .where(eq(assessments.userId, userId))
        .orderBy(desc(assessments.createdAt));
      
      return result;
    } catch (error) {
      console.error("Error getting user assessments:", error);
      return [];
    }
  }
}
