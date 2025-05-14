
import { users } from "@shared/schema";
import { db } from "../db";
import { eq, and, isNull } from "drizzle-orm";
import { User } from "@shared/types";

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  static async create(userData: Partial<User>): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  static async update(id: number, userData: Partial<User>): Promise<User | null> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }
}
