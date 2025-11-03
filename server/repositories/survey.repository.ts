import { db } from "../db";
import { surveys, surveyTeams, users, teams } from "@shared/schema";
import { eq, and, or, desc, asc, like, sql, isNull } from "drizzle-orm";
import { BaseRepository, PaginationOptions, PaginatedResult } from "./base.repository";
// import type { Transaction } from "drizzle-orm";

export interface Survey {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  fileReference: string | null;
  questionsCount: number;
  questions?: Array<{ id: number; question: string; category: string; details: string }> | null;
  authorId: number;
  status: string;
  completionLimit: number | null;
}

export interface SurveyWithAuthor extends Survey {
  author: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SurveyFilters {
  search?: string;
  status?: string;
  teamId?: number;
}

export interface SurveyPaginationOptions extends PaginationOptions {
  search?: string;
  status?: string;
  teamId?: number;
  pageSize: number;
}

export class SurveyRepository implements BaseRepository<Survey> {
  constructor(private drizzleDb = db) { }

  async create(data: any, tx?: any): Promise<Survey> {
    const db = tx || this.drizzleDb;
    const [survey] = await db.insert(surveys).values(data).returning();
    return survey;
  }

  async getById(id: number, tx?: any): Promise<Survey | null> {
    const db = tx || this.drizzleDb;
    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);
    return survey || null;
  }

  /**
   * Get survey by ID with team associations
   */
  async getByIdWithTeams(id: number, tx?: any): Promise<(Survey & { teams: { id: number; name: string }[] }) | null> {
    const db = tx || this.drizzleDb;
    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);

    if (!survey) return null;

    // Get team associations with details
    const teams = await this.getTeamsWithDetails(id, tx);

    return {
      ...survey,
      teams
    };
  }

  async update(id: number, data: any, tx?: any): Promise<Survey> {
    const db = tx || this.drizzleDb;
    const [updatedSurvey] = await db
      .update(surveys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return updatedSurvey;
  }

  async delete(id: number, tx?: any): Promise<boolean> {
    const db = tx || this.drizzleDb;
    const result = await db.delete(surveys).where(eq(surveys.id, id));
    return result.rowCount > 0;
  }

  async getAll(filters?: SurveyFilters, tx?: any): Promise<Survey[]> {
    const db = tx || this.drizzleDb;
    let query = db.select().from(surveys);

    if (filters) {
      const conditions = [];

      if (filters.search) {
        conditions.push(like(surveys.title, `%${filters.search}%`));
      }

      if (filters.status) {
        conditions.push(eq(surveys.status, filters.status));
      }

      if (filters.teamId !== undefined) {
        if (filters.teamId === 0) {
          // Global surveys (teamId is null)
          conditions.push(sql`NOT EXISTS (
          SELECT 1 FROM ${surveyTeams} 
          WHERE ${surveyTeams.surveyId} = ${surveys.id}
        )`);
        } else {
          conditions.push(sql`EXISTS (
          SELECT 1 FROM ${surveyTeams} 
          WHERE ${surveyTeams.surveyId} = ${surveys.id} 
          AND ${surveyTeams.teamId} = ${filters.teamId}
        )`);
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query;
  }

  /**
   * Get paginated surveys with author information and team associations
   */
  async getWithAuthorsPaginated(
    teamId: number,
    options: SurveyPaginationOptions,
    tx?: any
  ): Promise<PaginatedResult<SurveyWithAuthor & { teamIds: number[] }>> {
    const db = tx || this.drizzleDb;
    const { page, pageSize, sortBy = "updatedAt", sortOrder = "desc" } = options;
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions = [];

    if (options.search) {
      conditions.push(like(surveys.title, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(surveys.status, options.status));
    }

    // No team filtering in repository - let frontend handle team context

    // Build the query
    let query = db
      .select({
        id: surveys.id,
        title: surveys.title,
        createdAt: surveys.createdAt,
        updatedAt: surveys.updatedAt,
        fileReference: surveys.fileReference,
        questionsCount: surveys.questionsCount,
        authorId: surveys.authorId,
        status: surveys.status,
        completionLimit: surveys.completionLimit,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(surveys)
      .leftJoin(users, eq(users.id, surveys.authorId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    if (sortBy === "title") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.title) : asc(surveys.title));
    } else if (sortBy === "createdAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.createdAt) : asc(surveys.createdAt));
    } else if (sortBy === "updatedAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.updatedAt) : asc(surveys.updatedAt));
    } else {
      query = query.orderBy(desc(surveys.updatedAt));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(surveys)
      .leftJoin(users, eq(users.id, surveys.authorId));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [countResult] = await countQuery;
    const totalItems = countResult.count;

    // Get paginated results
    const surveysList = await query.limit(pageSize).offset(offset);

    // Add teams to each survey
    const surveysWithTeams = await Promise.all(
      surveysList.map(async (survey: SurveyWithAuthor) => {
        const teams = await this.getTeamsWithDetails(survey.id, tx);
        return {
          ...survey,
          teams
        };
      })
    );

    return {
      data: surveysWithTeams,
      pagination: {
        page,
        limit: pageSize,
        total: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        hasNext: page < Math.ceil(totalItems / pageSize),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get paginated surveys (simplified version)
   */
  async getAllPaginated(
    teamId: number,
    options: SurveyPaginationOptions,
    tx?: any
  ): Promise<PaginatedResult<Survey>> {
    const db = tx || this.drizzleDb;
    const { page, pageSize, sortBy = "updatedAt", sortOrder = "desc" } = options;
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions = [];

    if (options.search) {
      conditions.push(like(surveys.title, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(surveys.status, options.status));
    }

    if (teamId === 0) {
      // Global surveys (teamId is null)
      conditions.push(sql`NOT EXISTS (
          SELECT 1 FROM ${surveyTeams} 
          WHERE ${surveyTeams.surveyId} = ${surveys.id}
        )`);
    } else {
      conditions.push(sql`EXISTS (
          SELECT 1 FROM ${surveyTeams} 
          WHERE ${surveyTeams.surveyId} = ${surveys.id} 
          AND ${surveyTeams.teamId} = ${teamId}
        )`);
    }

    // Build the query
    let query = db
      .select({
        id: surveys.id,
        title: surveys.title,
        createdAt: surveys.createdAt,
        updatedAt: surveys.updatedAt,
        fileReference: surveys.fileReference,
        questionsCount: surveys.questionsCount,
        authorId: surveys.authorId,
        status: surveys.status,
        completionLimit: surveys.completionLimit,
      })
      .from(surveys);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    if (sortBy === "title") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.title) : asc(surveys.title));
    } else if (sortBy === "createdAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.createdAt) : asc(surveys.createdAt));
    } else if (sortBy === "updatedAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(surveys.updatedAt) : asc(surveys.updatedAt));
    } else {
      query = query.orderBy(desc(surveys.updatedAt));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(surveys);

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [countResult] = await countQuery;
    const totalItems = countResult.count;

    // Get paginated results
    const surveysList = await query.limit(pageSize).offset(offset);

    // Add teams to each survey
    const surveysWithTeams = await Promise.all(
      surveysList.map(async (survey: Survey) => {
        const teams = await this.getTeamsWithDetails(survey.id, tx);
        return {
          ...survey,
          teams
        };
      })
    );

    return {
      data: surveysWithTeams,
      pagination: {
        page,
        limit: pageSize,
        total: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        hasNext: page < Math.ceil(totalItems / pageSize),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get teams associated with a survey
   */
  async getTeams(surveyId: number, tx?: any): Promise<number[]> {
    const db = tx || this.drizzleDb;
    const results = await db
      .select({ teamId: surveyTeams.teamId })
      .from(surveyTeams)
      .where(eq(surveyTeams.surveyId, surveyId));

    return results.map((row: any) => row.teamId);
  }

  /**
   * Get teams with details associated with a survey
   */
  async getTeamsWithDetails(surveyId: number, tx?: any): Promise<{ id: number; name: string }[]> {
    const db = tx || this.drizzleDb;
    const results = await db
      .select({
        id: surveyTeams.teamId,
        name: teams.name
      })
      .from(surveyTeams)
      .leftJoin(teams, eq(teams.id, surveyTeams.teamId))
      .where(eq(surveyTeams.surveyId, surveyId));

    return results.map((row: any) => ({ id: row.id, name: row.name }));
  }

  /**
   * Update teams associated with a survey
   */
  async updateTeams(surveyId: number, teamIds: number[], tx?: any): Promise<void> {
    const db = tx || this.drizzleDb;

    return await db.transaction(async (trx: any) => {
      // Remove existing team associations
      await trx.delete(surveyTeams).where(eq(surveyTeams.surveyId, surveyId));

      // Add new team associations
      if (teamIds.length > 0) {
        const teamAssociations = teamIds.map(teamId => ({
          surveyId,
          teamId,
        }));

        await trx.insert(surveyTeams).values(teamAssociations);
      }
    });
  }

  /**
   * Check if user has access to a survey
   */
  async checkUserAccess(surveyId: number, userId: number, tx?: any): Promise<boolean> {
    const db = tx || this.drizzleDb;

    // Get survey details
    const survey = await this.getById(surveyId, tx);
    if (!survey) return false;

    // Check if user is the author
    if (survey.authorId === userId) return true;

    // Check if survey is global (no team restrictions)
    const teamIds = await this.getTeams(surveyId, tx);
    return teamIds.length === 0; // Global survey
  }
}
