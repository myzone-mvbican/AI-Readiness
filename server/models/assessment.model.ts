import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { assessments } from "@shared/schema";
import { Assessment, Survey } from "@shared/types";
import { InsertAssessment, UpdateAssessment } from "@shared/types/requests";
import { SurveyModel } from "./survey.model";

export class AssessmentModel {
  static async getByUserId(userId: number): Promise<Assessment[]> {
    try {
      const result = await db
        .select()
        .from(assessments)
        .where(eq(assessments.userId, userId))
        .orderBy(desc(assessments.updatedAt));

      return result.map((assessment) => ({
        ...assessment,
        answers: JSON.parse(assessment.answers),
      }));
    } catch (error) {
      console.error("Error getting assessments:", error);
      return [];
    }
  }

  static async getById(id: number): Promise<Assessment | undefined> {
    try {
      const [result] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id));

      if (!result) return undefined;

      return {
        ...result,
        answers: JSON.parse(result.answers),
      };
    } catch (error) {
      console.error(`Error getting assessment ${id}:`, error);
      return undefined;
    }
  }

  static async getWithSurveyInfo(id: number): Promise<
    | (Assessment & {
        survey: Survey;
      })
    | undefined
  > {
    try {
      const [result] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id));

      if (!result) return undefined;

      const survey = await SurveyModel.getById(result.surveyTemplateId);

      return {
        ...result,
        answers: JSON.parse(result.answers),
        survey,
      };
    } catch (error) {
      console.error(`Error getting assessment with survey info ${id}:`, error);
      return undefined;
    }
  }

  static async create(data: InsertAssessment): Promise<Assessment | undefined> {
    try {
      // Convert answers to JSON string for storage
      const dataToInsert = {
        ...data,
        answers: JSON.stringify(data.answers),
      };

      const [result] = await db
        .insert(assessments)
        .values(dataToInsert)
        .returning();

      return {
        ...result,
        answers: data.answers, // Use the original typed array
      };
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw error;
    }
  }

  static async update(
    id: number,
    data: UpdateAssessment,
  ): Promise<Assessment | undefined> {
    try {
      // Check if assessment exists
      const existingAssessment = await AssessmentModel.getById(id);
      if (!existingAssessment) return undefined;

      // Prepare update data
      const updateData: any = { ...data };

      // If answers are provided, convert to JSON string
      if (data.answers) {
        updateData.answers = JSON.stringify(data.answers);
      }

      // Update the record
      const [result] = await db
        .update(assessments)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, id))
        .returning();

      // Return the updated assessment with parsed answers
      return {
        ...result,
        answers: JSON.parse(result.answers),
      };
    } catch (error) {
      console.error(`Error updating assessment ${id}:`, error);
      return undefined;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning({ id: assessments.id });

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting assessment ${id}:`, error);
      return false;
    }
  }
}
