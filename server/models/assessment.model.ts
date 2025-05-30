import { db } from "../db";
import { eq, desc, isNull, isNotNull } from "drizzle-orm";
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
      
      // Handle completedOn timestamp when status changes to "completed"
      if (data.status === 'completed' && existingAssessment.status !== 'completed') {
        // Only set completedOn if it's not already set (idempotent)
        if (!existingAssessment.completedOn) {
          updateData.completedOn = new Date();
        }
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

  static async getGuestAssessmentsByEmail(email: string): Promise<Assessment[]> {
    try {
      const result = await db
        .select()
        .from(assessments)
        .where(isNull(assessments.userId)); // Only get guest assessments

      // Filter by email from guest JSON data
      const guestAssessments = result.filter(assessment => {
        if (!assessment.guest) return false;
        try {
          const guestData = JSON.parse(assessment.guest);
          return guestData.email === email;
        } catch (error) {
          console.error('Error parsing guest data:', error);
          return false;
        }
      });

      return guestAssessments.map((assessment) => ({
        ...assessment,
        answers: JSON.parse(assessment.answers),
      }));
    } catch (error) {
      console.error("Error getting guest assessments by email:", error);
      return [];
    }
  }

  static async assignGuestAssessmentsToUser(email: string, userId: number): Promise<boolean> {
    try {
      // Get all guest assessments for this email
      const guestAssessments = await this.getGuestAssessmentsByEmail(email);
      
      // Update each assessment to assign to the user
      for (const assessment of guestAssessments) {
        await db
          .update(assessments)
          .set({
            userId: userId,
            guest: null, // Clear guest data once assigned to user
            updatedAt: new Date(),
          })
          .where(eq(assessments.id, assessment.id));
      }

      return true;
    } catch (error) {
      console.error("Error assigning guest assessments to user:", error);
      return false;
    }
  }
}
