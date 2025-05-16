import { db } from "../db";
import { eq, and, inArray, desc, not } from "drizzle-orm";
import { Survey, SurveyWithAuthor } from "@shared/types";
import { surveys, surveyTeams } from "@shared/schema";
import { InsertSurvey, UpdateSurvey } from "@shared/types/requests";
import { UserModel } from "./user.model";
import { TeamModel } from "./team.model";

export class SurveyModel {
  // Getters
  static async getAll(teamId: number): Promise<Survey[]> {
    try {
      // Two types of surveys to return:
      // 1. Global surveys = public surveys NOT assigned to any team
      // 2. Team-specific surveys = public surveys assigned to the requested team

      // Get all team assignments to identify which surveys have team assignments
      const allAssignedSurveys = await db.select().from(surveyTeams);

      // Get the unique survey IDs that have ANY team assignment
      const assignedSurveyIds = Array.from(
        new Set(allAssignedSurveys.map((s) => s.surveyId)),
      );

      // STEP 1: Get global surveys (public surveys with no team assignments)
      let globalSurveys: Survey[] = [];

      // First check if we have any assigned surveys at all in the system
      if (assignedSurveyIds.length > 0) {
        // Get public surveys that are NOT assigned to any team
        globalSurveys = await db
          .select()
          .from(surveys)
          .where(
            and(
              eq(surveys.status, "public"),
              not(inArray(surveys.id, assignedSurveyIds)),
            ),
          )
          .orderBy(desc(surveys.updatedAt));
      } else {
        // If no team assignments exist at all, then all public surveys are global
        globalSurveys = await db
          .select()
          .from(surveys)
          .where(eq(surveys.status, "public"))
          .orderBy(desc(surveys.updatedAt));
      }

      // If teamId is 0, we only want global surveys
      if (teamId === 0) {
        return globalSurveys;
      }

      // STEP 2: Get team-specific surveys (assigned directly to the requested team)
      // Get survey IDs assigned to the requested team
      const teamSpecificSurveyIds = allAssignedSurveys
        .filter((assignment) => assignment.teamId === teamId)
        .map((assignment) => assignment.surveyId);

      // If no surveys are assigned to this team, just return global surveys
      if (teamSpecificSurveyIds.length === 0) {
        return globalSurveys;
      }

      // Otherwise, fetch the team-specific surveys
      const teamSurveys = await db
        .select()
        .from(surveys)
        .where(
          and(
            eq(surveys.status, "public"),
            inArray(surveys.id, teamSpecificSurveyIds),
          ),
        )
        .orderBy(desc(surveys.updatedAt));

      // Combine both result sets, ensuring no duplicates
      const allSurveyIds = new Set<number>();
      const uniqueSurveys: Survey[] = [];

      // Process global surveys first
      for (const survey of globalSurveys) {
        allSurveyIds.add(survey.id);
        uniqueSurveys.push(survey);
      }

      // Then add team-specific surveys (if not duplicates)
      for (const survey of teamSurveys) {
        if (!allSurveyIds.has(survey.id)) {
          uniqueSurveys.push(survey);
        }
      }

      return uniqueSurveys;
    } catch (error) {
      console.error("Error getting surveys:", error);
      return [];
    }
  }

  static async getById(id: number): Promise<Survey | undefined> {
    try {
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id));

      return survey;
    } catch (error) {
      console.error(`Error getting survey with id ${id}:`, error);
      return undefined;
    }
  }

  static async getWithAuthor(
    id: number,
  ): Promise<SurveyWithAuthor | undefined> {
    try {
      // First get the survey
      const survey = await SurveyModel.getById(id);
      if (!survey) return undefined;

      // Then get the author
      const author = await UserModel.getById(survey.authorId);
      if (!author) return undefined;

      // Get teams for this survey
      const teamIds = await SurveyModel.getTeams(survey.id);
      let teams: { id: number; name: string }[] = [];

      if (teamIds.length > 0) {
        // Fetch team details for each teamId
        const teamPromises = teamIds.map(async (id) => {
          const team = await TeamModel.getById(id);
          return team ? { id: team.id, name: team.name } : null;
        });

        // Filter out any null teams (those not found)
        teams = (await Promise.all(teamPromises)).filter(Boolean) as {
          id: number;
          name: string;
        }[];
      }

      // Combine survey with author and teams info
      return {
        ...survey,
        author: {
          name: author.name,
          email: author.email,
        },
        teams: teams,
      };
    } catch (error) {
      console.error(`Error getting survey with author for id ${id}:`, error);
      return undefined;
    }
  }

  static async getWithAuthors(teamId: number): Promise<SurveyWithAuthor[]> {
    try {
      let allSurveys: Survey[] = [];

      if (teamId === 0) {
        // For admins, get ALL surveys regardless of team
        const results = await db
          .select()
          .from(surveys)
          .orderBy(desc(surveys.updatedAt));
        allSurveys = results;
      } else {
        // Otherwise, just get surveys for this team and global surveys
        allSurveys = await SurveyModel.getAll(teamId);
      }

      // Map through surveys and add author and team information
      const surveysWithAuthors = await Promise.all(
        allSurveys.map(async (survey) => {
          const author = await UserModel.getById(survey.authorId);

          // Get teams for this survey
          const teamIds = await SurveyModel.getTeams(survey.id);
          let teams: { id: number; name: string }[] = [];

          if (teamIds.length > 0) {
            // Fetch team details for each teamId
            const teamPromises = teamIds.map(async (id) => {
              const team = await TeamModel.getById(id);
              return team ? { id: team.id, name: team.name } : null;
            });

            // Filter out any null teams (those not found)
            teams = (await Promise.all(teamPromises)).filter(Boolean) as {
              id: number;
              name: string;
            }[];
          }

          return {
            ...survey,
            author: {
              name: author?.name || "Unknown",
              email: author?.email || "unknown@example.com",
            },
            teams: teams,
          };
        }),
      );

      return surveysWithAuthors;
    } catch (error) {
      console.error(
        `Error getting surveys with authors for team ${teamId}:`,
        error,
      );
      return [];
    }
  }

  // Survey operations
  static async create(surveyData: InsertSurvey): Promise<Survey> {
    try {
      const [survey] = await db
        .insert(surveys)
        .values({
          ...surveyData,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: surveyData.status || "draft",
        })
        .returning();

      return survey;
    } catch (error) {
      console.error("Error creating survey:", error);
      throw error;
    }
  }

  static async update(
    id: number,
    surveyData: UpdateSurvey,
  ): Promise<Survey | undefined> {
    try {
      const [updatedSurvey] = await db
        .update(surveys)
        .set({
          ...surveyData,
          updatedAt: new Date(),
        })
        .where(eq(surveys.id, id))
        .returning();

      return updatedSurvey;
    } catch (error) {
      console.error(`Error updating survey with id ${id}:`, error);
      return undefined;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(surveys)
        .where(eq(surveys.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting survey with id ${id}:`, error);
      return false;
    }
  }

  // Survey-Team operations
  static async getTeams(surveyId: number): Promise<number[]> {
    try {
      const result = await db
        .select()
        .from(surveyTeams)
        .where(eq(surveyTeams.surveyId, surveyId));

      return result.map((st) => st.teamId);
    } catch (error) {
      console.error("Error getting survey teams:", error);
      return [];
    }
  }

  static async addTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      await db.insert(surveyTeams).values({
        surveyId,
        teamId,
      });
    } catch (error) {
      console.error("Error adding survey team:", error);
    }
  }

  static async removeTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      await db
        .delete(surveyTeams)
        .where(
          and(
            eq(surveyTeams.surveyId, surveyId),
            eq(surveyTeams.teamId, teamId),
          ),
        );
    } catch (error) {
      console.error("Error removing survey team:", error);
    }
  }

  static async updateTeams(surveyId: number, teamIds: number[]): Promise<void> {
    try {
      // Begin transaction
      await db.transaction(async (tx) => {
        // Delete all existing survey-team relationships
        await tx.delete(surveyTeams).where(eq(surveyTeams.surveyId, surveyId));

        // If there are team IDs, insert the new relationships
        if (teamIds.length > 0) {
          const values = teamIds.map((teamId) => ({
            surveyId,
            teamId,
          }));

          await tx.insert(surveyTeams).values(values);
        }
      });
    } catch (error) {
      console.error("Error updating survey teams:", error);
    }
  }
}
