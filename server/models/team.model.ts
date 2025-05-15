import { db } from "../db";
import { and, inArray, eq } from "drizzle-orm";
import { teams, userTeams } from "@shared/schema";
import { Team, TeamWithRole, UserTeam } from "@shared/types";
import { InsertTeam, InsertUserTeam } from "@shared/types/requests";

export class TeamModel {
  static async createTeam(teamData: InsertTeam): Promise<Team> {
    try {
      const [team] = await db.insert(teams).values(teamData).returning();
      return team;
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  }

  static async getTeam(id: number): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.id, id));
      return team;
    } catch (error) {
      console.error("Error getting team:", error);
      return undefined;
    }
  }

  static async getTeamByName(name: string): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.name, name));
      return team;
    } catch (error) {
      console.error("Error getting team by name:", error);
      return undefined;
    }
  }

  static async getTeamsByUserId(userId: number): Promise<TeamWithRole[]> {
    try {
      const result = await db
        .select({
          id: teams.id,
          name: teams.name,
          role: userTeams.role,
        })
        .from(userTeams)
        .innerJoin(teams, eq(userTeams.teamId, teams.id))
        .where(eq(userTeams.userId, userId));

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
      }));
    } catch (error) {
      console.error("Error getting teams by user ID:", error);
      return [];
    }
  }

  static async addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam> {
    try {
      const [userTeam] = await db
        .insert(userTeams)
        .values(userTeamData)
        .returning();
      return userTeam;
    } catch (error) {
      console.error("Error adding user to team:", error);
      throw error;
    }
  }

  static async updateUserTeams(
    userId: number,
    teamIds: number[],
  ): Promise<void> {
    try {
      // Get current teams for this user
      const currentUserTeams = await db
        .select()
        .from(userTeams)
        .where(eq(userTeams.userId, userId));

      const currentTeamIds = currentUserTeams.map((ut) => ut.teamId);

      // Teams to remove (in current but not in new list)
      const teamsToRemove = currentTeamIds.filter(
        (id) => !teamIds.includes(id),
      );

      // Teams to add (in new list but not in current)
      const teamsToAdd = teamIds.filter((id) => !currentTeamIds.includes(id));

      // Delete teams that should be removed
      if (teamsToRemove.length > 0) {
        await db
          .delete(userTeams)
          .where(
            and(
              eq(userTeams.userId, userId),
              inArray(userTeams.teamId, teamsToRemove),
            ),
          );
      }

      // Add new teams
      if (teamsToAdd.length > 0) {
        const newUserTeams = teamsToAdd.map((teamId) => ({
          userId,
          teamId,
          role: "member", // Default role for newly added teams
        }));

        await db.insert(userTeams).values(newUserTeams);
      }
    } catch (error) {
      console.error("Error updating user teams:", error);
      throw error;
    }
  }
}
