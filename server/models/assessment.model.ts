
import { db } from "../db";
import { eq } from "drizzle-orm";
import { assessments } from "@shared/schema";
import { Assessment } from "@shared/types";

export class AssessmentModel {
  static async getByUserId(userId: number): Promise<Assessment[]> {
    try {
      return await db
        .select()
        .from(assessments)
        .where(eq(assessments.userId, userId));
    } catch (error) {
      console.error("Error getting assessments by user ID:", error);
      return [];
    }
  }

  static async getById(id: number): Promise<Assessment | undefined> {
    try {
      const [assessment] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id));
      return assessment;
    } catch (error) {
      console.error("Error getting assessment by ID:", error);
      return undefined;
    }
  }

  static async getWithSurveyInfo(id: number): Promise<Assessment | undefined> {
    try {
      const [assessment] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id));
      return assessment;
    } catch (error) {
      console.error("Error getting assessment with survey info:", error);
      return undefined;
    }
  }

  static async create(data: Partial<Assessment>): Promise<Assessment | undefined> {
    try {
      const [assessment] = await db.insert(assessments).values(data).returning();
      return assessment;
    } catch (error) {
      console.error("Error creating assessment:", error);
      return undefined;
    }
  }

  static async update(
    id: number,
    data: Partial<Assessment>,
  ): Promise<Assessment | undefined> {
    try {
      const [assessment] = await db
        .update(assessments)
        .set(data)
        .where(eq(assessments.id, id))
        .returning();
      return assessment;
    } catch (error) {
      console.error("Error updating assessment:", error);
      return undefined;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return false;
    }
  }
}
