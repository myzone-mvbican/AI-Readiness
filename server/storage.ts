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
  type GoogleUserPayload,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

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
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Team operations
  createTeam(teamData: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  getTeamsByUserId(userId: number): Promise<TeamWithRole[]>;
  addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam>;
  updateUserTeams(userId: number, teamIds: number[]): Promise<void>;

  // Survey operations
  getSurveys(teamId: number): Promise<Survey[]>;
  getSurveyById(id: number): Promise<Survey | undefined>;
  createSurvey(surveyData: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, surveyData: UpdateSurvey): Promise<Survey | undefined>;
  deleteSurvey(id: number): Promise<boolean>;
  getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string } }) | undefined>;
  getSurveysWithAuthors(teamId: number): Promise<(Survey & { author: { name: string, email: string } })[]>;

  // Authentication operations
  generateToken(user: User): string;
  verifyToken(token: string): { userId: number } | null;
  verifyGoogleToken(token: string): Promise<GoogleUserPayload | null>;
  connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined>;
  disconnectGoogleAccount(userId: number): Promise<User | undefined>;
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
          googleId: users.googleId,
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
          googleId: users.googleId,
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
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
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
          googleId: users.googleId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.googleId, googleId));

      if (user) {
        // Add the role based on admin email check
        return {
          ...user,
          role: this.isAdmin(user.email) ? "admin" : "client",
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getUserByGoogleId:", error);
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
        googleId: insertUser.googleId || null,
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
  
  async getTeamByName(name: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.name, name));
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
  
  // Delete a user by ID
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, remove user from all teams
      await db.delete(userTeams).where(eq(userTeams.userId, id));
      
      // Then delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  // Update a user's team assignments
  async updateUserTeams(userId: number, teamIds: number[]): Promise<void> {
    try {
      // First, get current teams for this user
      const currentTeams = await this.getTeamsByUserId(userId);
      const currentTeamIds = currentTeams.map(team => team.id);
      
      // Transaction to ensure all operations complete or none do
      await db.transaction(async (tx) => {
        // Remove user from teams that are no longer assigned
        const teamsToRemove = currentTeamIds.filter(id => !teamIds.includes(id));
        if (teamsToRemove.length > 0) {
          await tx.delete(userTeams)
            .where(
              and(
                eq(userTeams.userId, userId),
                inArray(userTeams.teamId, teamsToRemove)
              )
            );
        }
        
        // Add user to new teams
        const teamsToAdd = teamIds.filter(id => !currentTeamIds.includes(id));
        for (const teamId of teamsToAdd) {
          await tx.insert(userTeams)
            .values({
              userId,
              teamId,
              role: "client", // Default role for new team assignments
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoNothing(); // In case the user is already in this team
        }
      });
    } catch (error) {
      console.error("Error updating user teams:", error);
      throw error;
    }
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
  
  async verifyGoogleToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      // Verify the token with Google
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
      );
      
      if (!response.ok) {
        console.error('Failed to verify Google token:', await response.text());
        return null;
      }
      
      const payload = await response.json() as GoogleUserPayload;
      return payload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }
  
  async connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined> {
    try {
      // Check if this Google ID is already connected to another account
      const existingUser = await this.getUserByGoogleId(googleId);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('This Google account is already connected to another user');
      }
      
      // Update the user's Google ID
      return this.updateUser(userId, { googleId });
    } catch (error) {
      console.error('Error connecting Google account:', error);
      throw error;
    }
  }
  
  async disconnectGoogleAccount(userId: number): Promise<User | undefined> {
    try {
      // First get the current user
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Ensure the user has a password before disconnecting Google
      if (!user.password) {
        throw new Error('Cannot disconnect Google account without a password set');
      }
      
      // Update the user to remove Google ID
      return this.updateUser(userId, { googleId: null });
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      throw error;
    }
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
      googleId: insertUser.googleId || null,
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
  
  async getTeamByName(name: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.name === name);
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
  
  async deleteUser(id: number): Promise<boolean> {
    if (!this.users.has(id)) return false;
    
    // First remove user from all teams
    const userTeamIds = Array.from(this.userTeams.entries())
      .filter(([_, userTeam]) => userTeam.userId === id)
      .map(([id, _]) => id);
      
    userTeamIds.forEach(id => this.userTeams.delete(id));
    
    // Then delete the user
    return this.users.delete(id);
  }
  
  async updateUserTeams(userId: number, teamIds: number[]): Promise<void> {
    // Get current teams for this user
    const currentTeams = await this.getTeamsByUserId(userId);
    const currentTeamIds = currentTeams.map(team => team.id);
    
    // Remove user from teams that are no longer assigned
    const teamsToRemove = currentTeamIds.filter(id => !teamIds.includes(id));
    
    if (teamsToRemove.length > 0) {
      const userTeamIdsToRemove = Array.from(this.userTeams.entries())
        .filter(([_, userTeam]) => 
          userTeam.userId === userId && teamsToRemove.includes(userTeam.teamId)
        )
        .map(([id, _]) => id);
        
      userTeamIdsToRemove.forEach(id => this.userTeams.delete(id));
    }
    
    // Add user to new teams
    const teamsToAdd = teamIds.filter(id => !currentTeamIds.includes(id));
    
    for (const teamId of teamsToAdd) {
      await this.addUserToTeam({
        userId,
        teamId,
        role: "client" // Default role for new team assignments
      });
    }
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
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.googleId === googleId);
  }
  
  async verifyGoogleToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      // Verify the token with Google
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
      );
      
      if (!response.ok) {
        console.error('Failed to verify Google token:', await response.text());
        return null;
      }
      
      const payload = await response.json() as GoogleUserPayload;
      return payload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }
  
  async connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined> {
    try {
      // Check if this Google ID is already connected to another account
      const existingUser = await this.getUserByGoogleId(googleId);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('This Google account is already connected to another user');
      }
      
      // Update the user's Google ID
      return this.updateUser(userId, { googleId });
    } catch (error) {
      console.error('Error connecting Google account:', error);
      throw error;
    }
  }
  
  async disconnectGoogleAccount(userId: number): Promise<User | undefined> {
    try {
      // First get the current user
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Ensure the user has a password before disconnecting Google
      if (!user.password) {
        throw new Error('Cannot disconnect Google account without a password set');
      }
      
      // Update the user to remove Google ID
      return this.updateUser(userId, { googleId: null });
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      throw error;
    }
  }

  // Survey Operations

  async getSurveys(teamId: number): Promise<Survey[]> {
    try {
      const result = await db
        .select()
        .from(surveys)
        .where(eq(surveys.teamId, teamId))
        .orderBy(desc(surveys.updatedAt));
      
      return result;
    } catch (error) {
      console.error('Error getting surveys:', error);
      return [];
    }
  }

  async getSurveyById(id: number): Promise<Survey | undefined> {
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

  async createSurvey(surveyData: InsertSurvey): Promise<Survey> {
    try {
      const [survey] = await db
        .insert(surveys)
        .values(surveyData)
        .returning();
      
      return survey;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  }

  async updateSurvey(id: number, surveyData: UpdateSurvey): Promise<Survey | undefined> {
    try {
      // Get the current survey
      const currentSurvey = await this.getSurveyById(id);
      if (!currentSurvey) {
        return undefined;
      }

      // Update the survey
      const [updatedSurvey] = await db
        .update(surveys)
        .set({
          ...surveyData,
          updatedAt: new Date()
        })
        .where(eq(surveys.id, id))
        .returning();
      
      return updatedSurvey;
    } catch (error) {
      console.error(`Error updating survey with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteSurvey(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(surveys)
        .where(eq(surveys.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting survey with id ${id}:`, error);
      return false;
    }
  }

  async getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string } }) | undefined> {
    try {
      const result = await db.query.surveys.findFirst({
        where: eq(surveys.id, id),
        with: {
          author: {
            columns: {
              name: true,
              email: true
            }
          }
        }
      });
      
      if (!result) return undefined;
      
      // Manual join since we don't have relations defined
      const author = await this.getUser(result.authorId);
      if (!author) return undefined;
      
      return {
        ...result,
        author: {
          name: author.name,
          email: author.email
        }
      };
    } catch (error) {
      console.error(`Error getting survey with author for id ${id}:`, error);
      return undefined;
    }
  }

  async getSurveysWithAuthors(teamId: number): Promise<(Survey & { author: { name: string, email: string } })[]> {
    try {
      // Get all surveys for the team
      const teamSurveys = await this.getSurveys(teamId);
      
      // Get author details for each survey
      const surveysWithAuthors = await Promise.all(
        teamSurveys.map(async (survey) => {
          const author = await this.getUser(survey.authorId);
          return {
            ...survey,
            author: {
              name: author?.name || 'Unknown',
              email: author?.email || 'unknown@example.com'
            }
          };
        })
      );
      
      return surveysWithAuthors;
    } catch (error) {
      console.error(`Error getting surveys with authors for team ${teamId}:`, error);
      return [];
    }
  }
}

// Change this to use DatabaseStorage
export const storage = new DatabaseStorage();
