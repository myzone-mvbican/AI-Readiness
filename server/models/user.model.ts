import { db } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { User, GoogleUserPayload } from "@shared/types";
import { users, userTeams, surveys } from "@shared/schema";
import { InsertUser, UpdateUser } from "@shared/types/requests";

// List of admin emails (environment variable based for security, with defaults)
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "bican.valeriu@myzone.ai,mike@myzone.ai"
)
  .split(",")
  .map((email) => email.trim().toLowerCase());

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  static async findByGoogleId(googleId: string): Promise<User | undefined> {
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
        updatedUserData.password = await this.hashPassword(userData.password);
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
      const user = await UserModel.findById(userId);
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
      // Verify the Google token by making a request to the tokeninfo endpoint
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
      );

      if (!response.ok) {
        throw new Error(
          `Google token verification failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data as GoogleUserPayload;
    } catch (error) {
      console.error("Error verifying Google token:", error);
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
}
