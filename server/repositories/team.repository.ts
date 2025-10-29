import { db } from "../db";
import { teams, userTeams, users } from "@shared/schema";
import { eq, and, or, ilike, desc, asc, sql, isNull } from "drizzle-orm";
import { Team, TeamWithRole, UserTeam } from "@shared/types";
import { InsertTeam, InsertUserTeam, UpdateTeam } from "@shared/types/requests";

export class TeamRepository {
  /**
   * Get team by name
   */
  static async getByName(name: string): Promise<Team | undefined> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name))
      .limit(1);
    
    return team;
  }

  /**
   * Get teams by user ID
   */
  static async getByUserId(userId: number): Promise<TeamWithRole[]> {
    const userTeamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        role: userTeams.role,
      })
      .from(teams)
      .innerJoin(userTeams, eq(teams.id, userTeams.teamId))
      .where(eq(userTeams.userId, userId))
      .orderBy(desc(teams.createdAt));

    return userTeamsData;
  }

  /**
   * Create a new team
   */
  static async create(teamData: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values({
        ...teamData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return team;
  }

  /**
   * Add user to team
   */
  static async addUser(userTeamData: InsertUserTeam): Promise<UserTeam> {
    const [membership] = await db
      .insert(userTeams)
      .values({
        ...userTeamData,
        createdAt: new Date(),
      })
      .returning();
    
    return membership;
  }

  /**
   * Get all teams with members
   */
  static async getAllWithMembers(): Promise<any[]> {
    const allTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        deletedAt: teams.deletedAt,
      })
      .from(teams)
      .where(isNull(teams.deletedAt)) // Only get non-deleted teams
      .orderBy(desc(teams.createdAt));

    // Get members for each team with user details
    const teamsWithMembers = await Promise.all(
      allTeams.map(async (team: any) => {
        const members = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: userTeams.role,
            createdAt: userTeams.createdAt,
          })
          .from(userTeams)
          .innerJoin(users, eq(userTeams.userId, users.id))
          .where(eq(userTeams.teamId, team.id));

        return {
          ...team,
          memberCount: members.length,
          members,
        };
      })
    );

    return teamsWithMembers;
  }

  /**
   * Update team
   */
  static async update(teamId: number, teamData: UpdateTeam): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({
        ...teamData,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();
    
    return updatedTeam;
  }


  /**
   * Check if team can be hard deleted
   */
  static async canHardDelete(teamId: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // First check if team exists and is soft-deleted
      const [team] = await db
        .select({ deletedAt: teams.deletedAt })
        .from(teams)
        .where(eq(teams.id, teamId));

      if (!team) {
        return { canDelete: false, reason: "Team not found" };
      }

      if (!team.deletedAt) {
        return { canDelete: false, reason: "Team must be soft-deleted first" };
      }

      // Check if team has any members
      const memberCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(userTeams)
        .where(eq(userTeams.teamId, teamId));

      if (memberCount[0].count > 0) {
        return { canDelete: false, reason: "Team has members" };
      }

      return { canDelete: true };
    } catch (error) {
      console.error("Error checking if team can be hard deleted:", error);
      return { canDelete: false, reason: "Error checking team status" };
    }
  }

  /**
   * Hard delete team
   */
  static async hardDelete(teamId: number): Promise<boolean> {
    const result = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Remove user from team
   */
  static async removeUser(userId: number, teamId: number): Promise<boolean> {
    const result = await db
      .delete(userTeams)
      .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Update user role in team
   */
  static async updateUserRole(userId: number, teamId: number, role: string): Promise<boolean> {
    const result = await db
      .update(userTeams)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: number): Promise<any[]> {
    const members = await db
      .select({
        userId: userTeams.userId,
        role: userTeams.role,
        createdAt: userTeams.createdAt,
      })
      .from(userTeams)
      .where(eq(userTeams.teamId, teamId))
      .orderBy(desc(userTeams.createdAt));

    return members;
  }

  /**
   * Update user teams
   */
  static async updateUser(userId: number, teamIds: number[]): Promise<void> {
    // Remove user from all teams
    await db
      .delete(userTeams)
      .where(eq(userTeams.userId, userId));

    // Add user to new teams
    if (teamIds.length > 0) {
      await db
        .insert(userTeams)
        .values(
          teamIds.map(teamId => ({
            userId,
            teamId,
            role: 'member',
            createdAt: new Date(),
          }))
        );
    }
  }

  /**
   * Search teams
   */
  static async searchTeams(searchTerm: string, page: number, pageSize: number): Promise<{
    teams: any[];
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;
    const searchPattern = `%${searchTerm}%`;

    // Get teams with search
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .where(and(
        ilike(teams.name, searchPattern)
      ))
      .orderBy(desc(teams.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(teams)
      .where(and(
        ilike(teams.name, searchPattern)
      ));

    const total = countResult[0].count;
    const totalPages = Math.ceil(total / pageSize);

    return {
      teams: teamsData,
      total,
      totalPages,
    };
  }

  /**
   * Soft delete team (mark as deleted)
   */
  static async softDelete(teamId: number): Promise<boolean> {
    try {
      await db
        .update(teams)
        .set({ 
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(teams.id, teamId));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Restore soft-deleted team
   */
  static async restore(teamId: number): Promise<boolean> {
    try {
      await db
        .update(teams)
        .set({ 
          deletedAt: null,
          updatedAt: new Date()
        })
        .where(eq(teams.id, teamId));
      return true;
    } catch (error) {
      return false;
    }
  }
}
