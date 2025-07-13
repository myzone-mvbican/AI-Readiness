import { db } from "../db";
import { and, inArray, eq, desc, sql } from "drizzle-orm";
import { teams, userTeams, users } from "@shared/schema";
import { Team, TeamWithRole, UserTeam, User } from "@shared/types";
import { InsertTeam, InsertUserTeam, UpdateTeam } from "@shared/types/requests";

export class TeamModel {
  static async create(teamData: InsertTeam): Promise<Team> {
    try {
      const [team] = await db.insert(teams).values(teamData).returning();
      return team;
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.id, id));
      return team;
    } catch (error) {
      console.error("Error getting team:", error);
      return undefined;
    }
  }

  static async getByName(name: string): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.name, name));
      return team;
    } catch (error) {
      console.error("Error getting team by name:", error);
      return undefined;
    }
  }

  static async getByUserId(userId: number): Promise<TeamWithRole[]> {
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

  static async addUser(userTeamData: InsertUserTeam): Promise<UserTeam> {
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

  static async updateUser(userId: number, teamIds: number[]): Promise<void> {
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

  // Admin team management methods
  static async getAll(): Promise<Team[]> {
    try {
      const result = await db.select().from(teams).orderBy(desc(teams.createdAt));
      return result;
    } catch (error) {
      console.error("Error getting all teams:", error);
      return [];
    }
  }

  static async getAllWithMembers(): Promise<Array<Team & { memberCount: number; members: Array<User & { role: string }> }>> {
    try {
      // Get teams with member counts
      const teamsWithCounts = await db
        .select({
          id: teams.id,
          name: teams.name,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
          memberCount: sql<number>`count(${userTeams.userId})::int`,
        })
        .from(teams)
        .leftJoin(userTeams, eq(teams.id, userTeams.teamId))
        .groupBy(teams.id, teams.name, teams.createdAt, teams.updatedAt)
        .orderBy(desc(teams.createdAt));

      // Get detailed members for each team
      const teamsWithMembers = await Promise.all(
        teamsWithCounts.map(async (team) => {
          const members = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              company: users.company,
              employeeCount: users.employeeCount,
              industry: users.industry,
              password: users.password,
              role: userTeams.role,
              googleId: users.googleId,
              resetToken: users.resetToken,
              resetTokenExpiry: users.resetTokenExpiry,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            })
            .from(userTeams)
            .innerJoin(users, eq(userTeams.userId, users.id))
            .where(eq(userTeams.teamId, team.id));

          return {
            ...team,
            members: members.map((member) => ({
              ...member,
              role: member.role as string,
            })),
          };
        })
      );

      return teamsWithMembers;
    } catch (error) {
      console.error("Error getting teams with members:", error);
      return [];
    }
  }

  static async update(id: number, teamData: UpdateTeam): Promise<Team | undefined> {
    try {
      const [team] = await db
        .update(teams)
        .set({ ...teamData, updatedAt: new Date() })
        .where(eq(teams.id, id))
        .returning();
      return team;
    } catch (error) {
      console.error("Error updating team:", error);
      return undefined;
    }
  }

  static async softDelete(id: number): Promise<boolean> {
    try {
      // For now, we'll implement soft delete by updating name to include "(deleted)"
      // In future, we could add a deletedAt field to the schema
      const team = await this.getById(id);
      if (!team || team.name.includes('(deleted)')) return false;

      await this.update(id, {
        name: `${team.name} (deleted)`,
      });

      return true;
    } catch (error) {
      console.error("Error soft deleting team:", error);
      return false;
    }
  }

  static async restoreTeam(id: number): Promise<boolean> {
    try {
      const team = await this.getById(id);
      if (!team || !team.name.includes('(deleted)')) return false;

      // Remove "(deleted)" from the team name
      const originalName = team.name.replace(' (deleted)', '');
      
      await this.update(id, {
        name: originalName,
      });

      return true;
    } catch (error) {
      console.error("Error restoring team:", error);
      return false;
    }
  }

  static async removeUser(userId: number, teamId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userTeams)
        .where(
          and(
            eq(userTeams.userId, userId),
            eq(userTeams.teamId, teamId)
          )
        );
      return !!result;
    } catch (error) {
      console.error("Error removing user from team:", error);
      return false;
    }
  }

  static async updateUserRole(userId: number, teamId: number, role: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(userTeams)
        .set({ role, updatedAt: new Date() })
        .where(
          and(
            eq(userTeams.userId, userId),
            eq(userTeams.teamId, teamId)
          )
        )
        .returning();
      return !!result;
    } catch (error) {
      console.error("Error updating user role in team:", error);
      return false;
    }
  }

  static async getTeamMembers(teamId: number): Promise<Array<User & { role: string }>> {
    try {
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          company: users.company,
          employeeCount: users.employeeCount,
          industry: users.industry,
          password: users.password,
          role: userTeams.role,
          googleId: users.googleId,
          resetToken: users.resetToken,
          resetTokenExpiry: users.resetTokenExpiry,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(userTeams)
        .innerJoin(users, eq(userTeams.userId, users.id))
        .where(eq(userTeams.teamId, teamId));

      return members.map((member) => ({
        ...member,
        role: member.role as string,
      }));
    } catch (error) {
      console.error("Error getting team members:", error);
      return [];
    }
  }
}
