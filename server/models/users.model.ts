
import { db } from "../db";
import { eq } from "drizzle-orm";
import { User } from "@shared/types";
import { users, userTeams, surveys } from "@shared/schema";
import { UpdateUser } from "@shared/types/requests";

export class UsersModel {
  static async update(
    id: number,
    userData: UpdateUser,
  ): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(userData)
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
      // First, delete all team associations
      await db.delete(userTeams).where(eq(userTeams.userId, id));

      // Then, delete user's surveys
      await db.delete(surveys).where(eq(surveys.authorId, id));

      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));

      return !!result;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  static async getUserTeams(userId: number) {
    try {
      const result = await db
        .select({
          id: userTeams.teamId,
          role: userTeams.role,
        })
        .from(userTeams)
        .where(eq(userTeams.userId, userId));
      
      return result;
    } catch (error) {
      console.error("Error getting user teams:", error);
      return [];
    }
  }
}
