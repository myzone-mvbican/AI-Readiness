import { db } from "server/db";
import { users, assessments } from "@shared/schema";
import { or, ilike, desc, asc, sql, eq } from "drizzle-orm";
import { TeamService } from "server/services/team.service";

const ADMIN_EMAILS = [
  "admin@myzone.ai",
  "support@myzone.ai",
  "dev@myzone.ai"
];

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
  /**
   * Parse and validate pagination parameters from request
   */
  static parsePaginationParams(req: any): { params: PaginationParams; error?: string } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    // Validate pagination parameters
    if (page < 1) {
      return { params: {} as PaginationParams, error: "Page must be greater than 0" };
    }

    if (![10, 25, 50, 100, 500, 1000].includes(limit)) {
      return { params: {} as PaginationParams, error: "Limit must be 10, 25, 50, 100, 500, or 1000" };
    }

    if (sortBy !== "createdAt") {
      return { params: {} as PaginationParams, error: "sortBy must be 'createdAt'" };
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return { params: {} as PaginationParams, error: "sortOrder must be 'asc' or 'desc'" };
    }

    return {
      params: {
        page,
        limit,
        search,
        sortBy: sortBy as "createdAt",
        sortOrder: sortOrder as "asc" | "desc",
      }
    };
  }

  static async getAll(params: PaginationParams): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Validate page size limits - allow larger limits for export
    const validatedLimit = [10, 25, 50, 100, 500, 1000].includes(limit) ? limit : 10;
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
      userResults.map(async (user: any) => {
        const teams = await TeamService.getByUserId(user.id);
        return {
          ...user,
          teams: teams,
        };
      })
    );

    // Get total count for pagination metadata
    let totalCount: number;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const countResult = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
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
        .select({ count: sql<number>`cast(count(*) as integer)` })
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

  /**
   * Update a user by ID
   */
  static async update(userId: number, updateData: any): Promise<any> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  /**
   * Delete a user by ID
   */
  static async delete(userId: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  /**
   * Get user by ID
   */
  static async getById(userId: number): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  }

  /**
   * Search users by name or email
   */
  static async searchByNameOrEmail(searchTerm: string): Promise<any[]> {
    const searchPattern = `%${searchTerm.trim()}%`;

    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        company: users.company,
        employeeCount: users.employeeCount,
        industry: users.industry,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(10);
  }

  /**
   * Get user assessments
   */
  static async getUserAssessments(userId: number): Promise<any[]> {
    return await db
      .select({
        id: assessments.id,
        surveyId: assessments.surveyTemplateId,
        completedAt: assessments.completedOn,
        createdAt: assessments.createdAt,
      })
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  /**
   * Check if user is admin
   */
  static isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }
}