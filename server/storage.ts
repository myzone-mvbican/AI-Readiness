import {
  users,
  teams,
  userTeams,
  type User,
  type InsertUser,
  type UpdateUser,
  type Team,
  type InsertTeam,
  type UserTeam,
  type InsertUserTeam,
  type TeamWithRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create a JWT_SECRET if not already set
if (!process.env.JWT_SECRET) {
  console.warn(
    "JWT_SECRET not set. Using a default secret for development. DO NOT USE THIS IN PRODUCTION!",
  );
  process.env.JWT_SECRET = "myzone-ai-dev-secret-2025";
}

// List of admin emails (environment variable based for security, with defaults)
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "bican.valeriu@myzone.ai,mike@myzone.ai"
).split(",").map(email => email.trim().toLowerCase());

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Team operations
  createTeam(teamData: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByUserId(userId: number): Promise<TeamWithRole[]>;
  addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam>;

  // Authentication operations
  generateToken(user: User): string;
  verifyToken(token: string): { userId: number } | null;
  isAdmin(email: string): boolean;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Select only the fields we know exist to prevent errors
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          password: users.password,
          company: users.company,
          employeeCount: users.employeeCount,
          industry: users.industry,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, id));

      if (user) {
        // Add the role based on admin email check
        return {
          ...user,
          role: this.isAdmin(user.email) ? "admin" : "client",
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Select only the fields we know exist to prevent errors
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          password: users.password,
          company: users.company,
          employeeCount: users.employeeCount,
          industry: users.industry,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.email, email));

      if (user) {
        // Add the role based on admin email check
        return {
          ...user,
          role: this.isAdmin(user.email) ? "admin" : "client",
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash the password before storing
      const hashedPassword = await this.hashPassword(insertUser.password);

      // Check if user should have admin role based on email
      const role = this.isAdmin(insertUser.email) ? "admin" : "client";

      // Prepare values object without role first (in case it doesn't exist yet)
      const values = {
        name: insertUser.name,
        email: insertUser.email,
        password: hashedPassword,
        company: insertUser.company || null,
        employeeCount: insertUser.employeeCount || null,
        industry: insertUser.industry || null,
        updatedAt: new Date(),
      };

      // Try to insert with role field
      try {
        // First attempt with role
        const [user] = await db
          .insert(users)
          .values({
            ...values,
            role: role,
          })
          .returning();
        return user;
      } catch (e) {
        // If that fails (likely role column doesn't exist yet), try without
        const [user] = await db.insert(users).values(values).returning();

        // Add role to the returned user object
        return {
          ...user,
          role,
        };
      }
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    userData: UpdateUser,
  ): Promise<User | undefined> {
    // First get the current user to ensure we have all data
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      return undefined;
    }

    // Hash the password if provided
    let updatedUserData = { ...userData };

    if (userData.password) {
      updatedUserData.password = await this.hashPassword(userData.password);
    }

    // Make sure we're maintaining all fields by merging with current data
    // We'll spread these in the order: current data, new data, updated timestamp
    // to ensure new data takes precedence
    const [updatedUser] = await db
      .update(users)
      .set({
        ...currentUser, // Start with all existing fields
        ...updatedUserData, // Override with new data
        updatedAt: new Date(), // Always update timestamp
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Team operations
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values({
        name: teamData.name,
        updatedAt: new Date(),
      })
      .returning();

    return team;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamsByUserId(userId: number): Promise<TeamWithRole[]> {
    // Join userTeams with teams to get all teams for a user with their roles
    const teamWithRoles = await db
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

    return teamWithRoles;
  }

  async addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam> {
    const [userTeam] = await db
      .insert(userTeams)
      .values({
        userId: userTeamData.userId,
        teamId: userTeamData.teamId,
        role: userTeamData.role || "client",
        updatedAt: new Date(),
      })
      .returning();

    return userTeam;
  }

  // Authentication operations
  generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role || "client", // Include role in token
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
        role?: string;
      };
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }

  isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }
}

// For backward compatibility with existing code
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private userTeams: Map<number, UserTeam>;
  currentId: number;
  currentTeamId: number;
  currentUserTeamId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.userTeams = new Map();
    this.currentId = 1;
    this.currentTeamId = 1;
    this.currentUserTeamId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const hashedPassword = await this.hashPassword(insertUser.password);
    const role = this.isAdmin(insertUser.email) ? "admin" : "client";

    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      company: insertUser.company || null,
      employeeCount: insertUser.employeeCount || null,
      industry: insertUser.industry || null,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    userData: UpdateUser,
  ): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    // Hash password if provided
    let updatedUserData = { ...userData };

    if (userData.password) {
      updatedUserData.password = await this.hashPassword(userData.password);
    }

    // Ensure we keep all fields with the same priority as DatabaseStorage
    const updatedUser = {
      ...existingUser, // Keep all existing fields
      ...updatedUserData, // Override with new data
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Team operations
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = {
      id,
      name: teamData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByUserId(userId: number): Promise<TeamWithRole[]> {
    const userTeamEntries = Array.from(this.userTeams.values()).filter(
      (userTeam) => userTeam.userId === userId,
    );

    const teamsWithRoles: TeamWithRole[] = userTeamEntries
      .map((userTeam) => {
        const team = this.teams.get(userTeam.teamId);
        if (!team) return null;

        return {
          ...team,
          role: userTeam.role,
        };
      })
      .filter(Boolean) as TeamWithRole[];

    return teamsWithRoles;
  }

  async addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam> {
    const id = this.currentUserTeamId++;
    const userTeam: UserTeam = {
      id,
      userId: userTeamData.userId,
      teamId: userTeamData.teamId,
      role: userTeamData.role || "client",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userTeams.set(id, userTeam);
    return userTeam;
  }

  generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role || "client",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
        role?: string;
      };
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }

  isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }
}

// Change this to use DatabaseStorage
export const storage = new DatabaseStorage();
