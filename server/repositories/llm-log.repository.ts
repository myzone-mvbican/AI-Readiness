import { db } from "../db";
import { llmLogs } from "@shared/schema";
import { eq, and, or, desc, asc, like, sql, isNull, gte, lte } from "drizzle-orm";
import { BaseRepository, PaginationOptions, PaginatedResult } from "./base.repository";

export interface LLMLog {
  id: number;
  schemaVersion: number;
  userId?: number | null;
  organizationId?: number | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  environment: string;
  route?: string | null;
  featureName?: string | null;
  provider: string;
  model: string;
  endpoint?: string | null;
  request: any; // JSONB
  temperature?: number | null;
  maxTokens?: number | null;
  response?: any | null; // JSONB
  metrics?: any | null; // JSONB
  retries: number;
  security?: any | null; // JSONB
  redactionStatus: string;
  debug?: any | null; // JSONB
  stableTrace?: any | null; // JSONB
}

export interface LLMLogFilters {
  userId?: number;
  organizationId?: number;
  startTime?: Date;
  endTime?: Date;
  route?: string;
  model?: string;
  provider?: string;
  environment?: string;
  featureName?: string;
  status?: "success" | "error";
  includeDeleted?: boolean;
}

export interface LLMLogPaginationOptions extends PaginationOptions {
  filters?: LLMLogFilters;
}

export class LLMLogRepository implements BaseRepository<LLMLog> {
  constructor(private drizzleDb = db) {}

  async create(data: any, tx?: any): Promise<LLMLog> {
    const db = tx || this.drizzleDb;
    const [log] = await db.insert(llmLogs).values(data).returning();
    return log;
  }

  async getById(id: number, tx?: any): Promise<LLMLog | null> {
    const db = tx || this.drizzleDb;
    const [log] = await db
      .select()
      .from(llmLogs)
      .where(and(eq(llmLogs.id, id), isNull(llmLogs.deletedAt)))
      .limit(1);
    return log || null;
  }

  async update(id: number, data: any, tx?: any): Promise<LLMLog> {
    const db = tx || this.drizzleDb;
    const [updatedLog] = await db
      .update(llmLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(llmLogs.id, id))
      .returning();
    return updatedLog;
  }

  async delete(id: number, tx?: any): Promise<boolean> {
    const db = tx || this.drizzleDb;
    // Soft delete
    const result = await db
      .update(llmLogs)
      .set({ deletedAt: new Date() })
      .where(eq(llmLogs.id, id));
    return result.rowCount > 0;
  }

  async getAll(filters?: LLMLogFilters, tx?: any): Promise<LLMLog[]> {
    const db = tx || this.drizzleDb;
    let query = db.select().from(llmLogs);

    const conditions: any[] = [];

    // Soft delete filter
    if (!filters?.includeDeleted) {
      conditions.push(isNull(llmLogs.deletedAt));
    }

    // Apply filters
    if (filters) {
      if (filters.userId !== undefined) {
        conditions.push(eq(llmLogs.userId, filters.userId));
      }
      if (filters.organizationId !== undefined) {
        conditions.push(eq(llmLogs.organizationId, filters.organizationId));
      }
      if (filters.provider) {
        conditions.push(eq(llmLogs.provider, filters.provider));
      }
      if (filters.model) {
        conditions.push(eq(llmLogs.model, filters.model));
      }
      if (filters.environment) {
        conditions.push(eq(llmLogs.environment, filters.environment));
      }
      if (filters.route) {
        conditions.push(like(llmLogs.route, `%${filters.route}%`));
      }
      if (filters.featureName) {
        conditions.push(like(llmLogs.featureName, `%${filters.featureName}%`));
      }
      if (filters.startTime) {
        conditions.push(gte(llmLogs.timestamp, filters.startTime));
      }
      if (filters.endTime) {
        conditions.push(lte(llmLogs.timestamp, filters.endTime));
      }
      if (filters.status) {
        // Filter by response status using JSONB query
        conditions.push(
          sql`${llmLogs.response}->>'status' = ${filters.status}`
        );
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(llmLogs.timestamp));
    return results;
  }

  /**
   * Get logs with pagination
   */
  async getPaginated(
    options: LLMLogPaginationOptions,
    tx?: any
  ): Promise<PaginatedResult<LLMLog>> {
    const db = tx || this.drizzleDb;
    const { page, limit, sortBy = "timestamp", sortOrder = "desc", filters } = options;

    const conditions: any[] = [];

    // Soft delete filter
    if (!filters?.includeDeleted) {
      conditions.push(isNull(llmLogs.deletedAt));
    }

    // Apply filters
    if (filters) {
      if (filters.userId !== undefined) {
        conditions.push(eq(llmLogs.userId, filters.userId));
      }
      if (filters.organizationId !== undefined) {
        conditions.push(eq(llmLogs.organizationId, filters.organizationId));
      }
      if (filters.provider) {
        conditions.push(eq(llmLogs.provider, filters.provider));
      }
      if (filters.model) {
        conditions.push(eq(llmLogs.model, filters.model));
      }
      if (filters.environment) {
        conditions.push(eq(llmLogs.environment, filters.environment));
      }
      if (filters.route) {
        conditions.push(like(llmLogs.route, `%${filters.route}%`));
      }
      if (filters.featureName) {
        conditions.push(like(llmLogs.featureName, `%${filters.featureName}%`));
      }
      if (filters.startTime) {
        conditions.push(gte(llmLogs.timestamp, filters.startTime));
      }
      if (filters.endTime) {
        conditions.push(lte(llmLogs.timestamp, filters.endTime));
      }
      if (filters.status) {
        conditions.push(
          sql`${llmLogs.response}->>'status' = ${filters.status}`
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(llmLogs)
      .where(whereClause);
    const [{ count: total }] = await countQuery;

    // Get paginated data
    const orderByColumn =
      sortBy === "timestamp"
        ? llmLogs.timestamp
        : sortBy === "createdAt"
        ? llmLogs.createdAt
        : llmLogs.timestamp;

    const orderByFn = sortOrder === "asc" ? asc : desc;

    const data = await db
      .select()
      .from(llmLogs)
      .where(whereClause)
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

