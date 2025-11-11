import { db } from "../db";
import { eq, or, ilike, desc, and, isNotNull, gt, sql, isNull } from "drizzle-orm";
import { users, userTeams, teams, assessments } from "@shared/schema";
import { User, Team } from "@shared/types";
import { InsertUser, UpdateUser } from "@shared/types/requests";
import { BaseRepository, PaginationOptions, PaginatedResult, FilterOptions } from "./base.repository";

/**
 * UserRepository - Data access layer for User operations
 * Implements repository pattern with transaction support
 */
export class UserRepository implements BaseRepository<User> {
  constructor(private database = db) {}

  /**
   * Create a new user
   */
  async create(data: InsertUser, tx?: any): Promise<User> {
    const db = tx || this.database;
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  /**
   * Get user by ID
   */
  async getById(id: number, tx?: any): Promise<User | null> {
    const db = tx || this.database;
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  /**
   * Update user by ID
   */
  async update(id: number, data: UpdateUser, tx?: any): Promise<User> {
    const db = tx || this.database;
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /**
   * Delete user by ID
   */
  async delete(id: number, tx?: any): Promise<boolean> {
    const db = tx || this.database;
    try {
      // Delete user teams first
      await db.delete(userTeams).where(eq(userTeams.userId, id));
      // Delete user
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  /**
   * Get all users with optional filters
   */
  async getAll(filters?: FilterOptions, tx?: any): Promise<User[]> {
    const db = tx || this.database;
    let query = db.select().from(users);

    if (filters?.search) {
      query = query.where(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )
      );
    }

    return await query.orderBy(desc(users.createdAt));
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string, tx?: any): Promise<User | null> {
    const db = tx || this.database;
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return result[0] || null;
  }

  /**
   * Get user by Google ID
   */
  async getByGoogleId(googleId: string, tx?: any): Promise<User | null> {
    const db = tx || this.database;
    const result = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return result[0] || null;
  }

  /**
   * Get user by Microsoft ID
   */
  async getByMicrosoftId(microsoftId: string, tx?: any): Promise<User | null> {
    const db = tx || this.database;
    const result = await db
      .select()
      .from(users)
      .where(eq(users.microsoftId, microsoftId));
    return result[0] || null;
  }

  /**
   * Search users with pagination
   */
  async searchUsers(
    searchTerm: string, 
    pagination: PaginationOptions,
    tx?: any
  ): Promise<PaginatedResult<User>> {
    const db = tx || this.database;
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    // Build search conditions
    const searchPattern = `%${searchTerm.trim()}%`;
    const whereCondition = or(
      ilike(users.name, searchPattern),
      ilike(users.email, searchPattern)
    );

    // Get total count
    const totalResult = await db
      .select({ count: users.id })
      .from(users)
      .where(whereCondition);
    const total = totalResult.length;

    // Get paginated results
    const data = await db
      .select()
      .from(users)
      .where(whereCondition)
      .orderBy(sortOrder === 'desc' ? desc(users[sortBy as keyof typeof users] as any) : users[sortBy as keyof typeof users] as any)
      .limit(limit)
      .offset(offset);

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

  /**
   * Get user's teams
   */
  async getUserTeams(userId: number, tx?: any): Promise<Team[]> {
    const db = tx || this.database;
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        role: userTeams.role,
      })
      .from(userTeams)
      .innerJoin(teams, eq(userTeams.teamId, teams.id))
      .where(eq(userTeams.userId, userId));

    return result;
  }

  /**
   * Create user with default team assignment (transaction)
   */
  async createWithDefaultTeam(
    userData: InsertUser,
    teamId: number,
    role: string = 'client',
    tx?: any
  ): Promise<{ user: User; team: Team }> {
    const db = tx || this.database;
    
    return await db.transaction(async (trx: any) => {
      // Create user
      const user = await this.create(userData, trx);
      
      // Add user to team
      await trx.insert(userTeams).values({
        userId: user.id,
        teamId,
        role,
      });

      // Get team details
      const [team] = await trx
        .select()
        .from(teams)
        .where(eq(teams.id, teamId));

      return { user, team };
    });
  }

  /**
   * Transfer guest assessments to user
   */
  async transferGuestAssessmentsToUser(
    email: string,
    userId: number,
    tx?: any
  ): Promise<void> {
    const db = tx || this.database;
    
    console.log(`🔄 Transferring guest assessments for email: ${email} to user ID: ${userId}`);
    
    const result = await db
      .update(assessments)
      .set({ 
        userId,
        guest: null, // Clear guest data
        updatedAt: new Date()
      })
      .where(
        and(
          sql`${assessments.guest}::jsonb->>'email' = ${email}`, // Cast text to jsonb for JSON extraction
          isNull(assessments.userId)
        )
      )
      .returning({ id: assessments.id });
    
    console.log(`✅ Transferred ${result.length} guest assessment(s):`, result.map((r: any) => r.id));
  }

  /**
   * Update user's Google ID
   */
  async connectGoogleAccount(
    userId: number,
    googleId: string,
    tx?: any
  ): Promise<User> {
    return await this.update(userId, { googleId }, tx);
  }

  /**
   * Disconnect Google account
   */
  async disconnectGoogleAccount(userId: number, tx?: any): Promise<User> {
    return await this.update(userId, { googleId: null }, tx);
  }

  /**
   * Connect Microsoft account
   */
  async connectMicrosoftAccount(
    userId: number,
    microsoftId: string,
    tx?: any
  ): Promise<User> {
    return await this.update(userId, { microsoftId }, tx);
  }

  /**
   * Disconnect Microsoft account
   */
  async disconnectMicrosoftAccount(userId: number, tx?: any): Promise<User> {
    return await this.update(userId, { microsoftId: null }, tx);
  }

  /**
   * Set password reset token
   */
  async setResetToken(
    userId: number,
    token: string,
    expiry: Date,
    tx?: any
  ): Promise<void> {
    const db = tx || this.database;
    
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Clear password reset token
   */
  async clearResetToken(userId: number, tx?: any): Promise<void> {
    const db = tx || this.database;
    
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Get user by reset token
   */
  async getByResetToken(token: string, tx?: any): Promise<User | null> {
    const db = tx || this.database;
    
    // Use database time for comparison to avoid timezone issues
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          isNotNull(users.resetTokenExpiry),
          sql`reset_token_expiry > NOW()`
        )
      );
    
    const user = result[0];
    if (!user) {
      return null;
    }
    
    return user;
  }
}
