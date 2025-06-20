import { db } from "../db";
import { assessments, surveys } from "@shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export class CompletionService {
  /**
   * Check if a user can take a survey based on completion limits
   */
  static async canUserTakeSurvey(
    surveyId: number,
    userId?: number,
    guestEmail?: string
  ): Promise<{
    canTake: boolean;
    completionCount: number;
    completionLimit: number | null;
    message?: string;
  }> {
    try {
      // Get survey with completion limit
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, surveyId));

      if (!survey) {
        return {
          canTake: false,
          completionCount: 0,
          completionLimit: null,
          message: "Survey not found",
        };
      }

      // If no completion limit, user can always take it
      if (!survey.completionLimit) {
        return {
          canTake: true,
          completionCount: 0,
          completionLimit: null,
        };
      }

      // Count completed assessments for this user/survey combination
      let completionCount = 0;

      if (userId) {
        // For authenticated users - count completed assessments AND draft/in-progress that could be completed
        const allUserAssessments = await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.surveyTemplateId, surveyId),
              eq(assessments.userId, userId)
            )
          );
        
        // Count completed assessments + assessments that could be completed (draft/in-progress)
        completionCount = allUserAssessments.filter(assessment => 
          assessment.status === "completed" || 
          assessment.status === "draft" || 
          assessment.status === "in-progress"
        ).length;
      } else if (guestEmail) {
        // For guest users - check by email in guest field (all statuses)
        const allGuestAssessments = await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.surveyTemplateId, surveyId),
              isNotNull(assessments.guest)
            )
          );

        // Filter by email from guest JSON data and count all assessments (not just completed)
        completionCount = allGuestAssessments.filter(assessment => {
          if (!assessment.guest) return false;
          try {
            const guestData = JSON.parse(assessment.guest);
            return guestData.email === guestEmail;
          } catch (error) {
            return false;
          }
        }).length;
      }

      const canTake = completionCount < survey.completionLimit;
      
      return {
        canTake,
        completionCount,
        completionLimit: survey.completionLimit,
        message: canTake 
          ? undefined 
          : `You have reached the completion limit for this survey (${completionCount}/${survey.completionLimit})`,
      };
    } catch (error) {
      console.error("Error checking survey completion eligibility:", error);
      return {
        canTake: false,
        completionCount: 0,
        completionLimit: null,
        message: "Error checking completion eligibility",
      };
    }
  }

  /**
   * Get completion stats for multiple surveys for a user
   */
  static async getUserCompletionStats(
    surveyIds: number[],
    userId?: number,
    guestEmail?: string
  ): Promise<Record<number, { completionCount: number; completionLimit: number | null }>> {
    const stats: Record<number, { completionCount: number; completionLimit: number | null }> = {};

    for (const surveyId of surveyIds) {
      const result = await this.canUserTakeSurvey(surveyId, userId, guestEmail);
      stats[surveyId] = {
        completionCount: result.completionCount,
        completionLimit: result.completionLimit,
      };
    }

    return stats;
  }

  /**
   * Reset completion count for a user on a specific survey (admin function)
   */
  static async resetUserCompletions(
    surveyId: number,
    userId?: number,
    guestEmail?: string
  ): Promise<boolean> {
    try {
      if (userId) {
        // Delete completed assessments for authenticated user
        await db
          .delete(assessments)
          .where(
            and(
              eq(assessments.surveyTemplateId, surveyId),
              eq(assessments.userId, userId),
              eq(assessments.status, "completed")
            )
          );
      } else if (guestEmail) {
        // For guest users, we need to find and delete by email
        const guestAssessments = await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.surveyTemplateId, surveyId),
              eq(assessments.status, "completed"),
              isNotNull(assessments.guest)
            )
          );

        // Filter and delete assessments matching the email
        for (const assessment of guestAssessments) {
          if (!assessment.guest) continue;
          try {
            const guestData = JSON.parse(assessment.guest);
            if (guestData.email === guestEmail) {
              await db
                .delete(assessments)
                .where(eq(assessments.id, assessment.id));
            }
          } catch (error) {
            console.error("Error parsing guest data during reset:", error);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error resetting user completions:", error);
      return false;
    }
  }
}