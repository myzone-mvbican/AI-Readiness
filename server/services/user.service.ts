import { db } from "../db";
import { users } from "@shared/schema";
import { or, ilike, desc, asc, sql, count } from "drizzle-orm";
import { TeamModel } from "../models/team.model";

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedUsersResponse {
  users: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UserService {
  static async getAll(params: PaginationParams): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Validate page size limits
    const validatedLimit = [10, 25, 50].includes(limit) ? limit : 10;
    const offset = (page - 1) * validatedLimit;

    // Build base query
    const baseSelect = {
      id: users.id,
      name: users.name,
      email: users.email,
      company: users.company,
      employeeCount: users.employeeCount,
      industry: users.industry,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    };

    // Get paginated users with or without search
    let userResults;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      userResults = await db
        .select(baseSelect)
        .from(users)
        .where(
          or(
            ilike(users.name, searchTerm),
            ilike(users.email, searchTerm)
          )
        )
        .orderBy(sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt))
        .limit(validatedLimit)
        .offset(offset);
    } else {
      userResults = await db
        .select(baseSelect)
        .from(users)
        .orderBy(sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt))
        .limit(validatedLimit)
        .offset(offset);
    }

    // Add teams to each user
    const usersWithTeams = await Promise.all(
      userResults.map(async (user) => {
        const teams = await TeamModel.getByUserId(user.id);
        return {
          ...user,
          teams: teams,
        };
      })
    );

    // Get total count for pagination metadata
    let totalCount;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          or(
            ilike(users.name, searchTerm),
            ilike(users.email, searchTerm)
          )
        );
      totalCount = countResult[0].count;
    } else {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      totalCount = countResult[0].count;
    }

    const totalPages = Math.ceil(totalCount / validatedLimit);

    return {
      users: usersWithTeams,
      pagination: {
        page,
        limit: validatedLimit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}