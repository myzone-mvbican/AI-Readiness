import {
  users,
  teams,
  userTeams,
  surveys,
  type User,
  type InsertUser,
  type UpdateUser,
  type Team,
  type InsertTeam,
  type UserTeam,
  type InsertUserTeam,
  type TeamWithRole,
  type GoogleUserPayload,
  type Survey,
  type InsertSurvey,
  type UpdateSurvey,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, isNull, desc } from "drizzle-orm";
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
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId));
      return user;
    } catch (error) {
      console.error('Error getting user by Google ID:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash the password if provided
      let userWithHashedPwd = { ...insertUser };
      if (insertUser.password) {
        userWithHashedPwd.password = await this.hashPassword(insertUser.password);
      }

      // Lowercase the email to ensure consistency
      if (userWithHashedPwd.email) {
        userWithHashedPwd.email = userWithHashedPwd.email.toLowerCase();
      }

      // Insert user into database
      const [user] = await db.insert(users).values(userWithHashedPwd).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    userData: UpdateUser,
  ): Promise<User | undefined> {
    try {
      // If a new password is provided, hash it
      let updatedUserData = { ...userData };
      if (userData.password) {
        updatedUserData.password = await this.hashPassword(userData.password);
      }

      // Lowercase the email to ensure consistency
      if (updatedUserData.email) {
        updatedUserData.email = updatedUserData.email.toLowerCase();
      }

      // Update user in database
      const [user] = await db
        .update(users)
        .set(updatedUserData)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      return !!result;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    try {
      const [team] = await db.insert(teams).values(teamData).returning();
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async getTeam(id: number): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.id, id));
      return team;
    } catch (error) {
      console.error('Error getting team:', error);
      return undefined;
    }
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    try {
      const [team] = await db.select().from(teams).where(eq(teams.name, name));
      return team;
    } catch (error) {
      console.error('Error getting team by name:', error);
      return undefined;
    }
  }

  async getTeamsByUserId(userId: number): Promise<TeamWithRole[]> {
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

      return result.map(row => ({
        id: row.id,
        name: row.name,
        role: row.role,
      }));
    } catch (error) {
      console.error('Error getting teams by user ID:', error);
      return [];
    }
  }

  async addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam> {
    try {
      const [userTeam] = await db.insert(userTeams).values(userTeamData).returning();
      return userTeam;
    } catch (error) {
      console.error('Error adding user to team:', error);
      throw error;
    }
  }

  async updateUserTeams(userId: number, teamIds: number[]): Promise<void> {
    try {
      // Get current teams for this user
      const currentUserTeams = await db
        .select()
        .from(userTeams)
        .where(eq(userTeams.userId, userId));
      
      const currentTeamIds = currentUserTeams.map(ut => ut.teamId);
      
      // Teams to remove (in current but not in new list)
      const teamsToRemove = currentTeamIds.filter(id => !teamIds.includes(id));
      
      // Teams to add (in new list but not in current)
      const teamsToAdd = teamIds.filter(id => !currentTeamIds.includes(id));
      
      // Delete teams that should be removed
      if (teamsToRemove.length > 0) {
        await db
          .delete(userTeams)
          .where(
            and(
              eq(userTeams.userId, userId),
              inArray(userTeams.teamId, teamsToRemove)
            )
          );
      }
      
      // Add new teams
      if (teamsToAdd.length > 0) {
        const newUserTeams = teamsToAdd.map(teamId => ({
          userId,
          teamId,
          role: 'member', // Default role for newly added teams
        }));
        
        await db.insert(userTeams).values(newUserTeams);
      }
    } catch (error) {
      console.error('Error updating user teams:', error);
      throw error;
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
  
  async verifyGoogleToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      // Verify the Google token by making a request to the tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      
      if (!response.ok) {
        throw new Error(`Google token verification failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as GoogleUserPayload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }
  
  async connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined> {
    try {
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
        .values({
          ...surveyData,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: surveyData.status || 'draft',
        })
        .returning();
      
      return survey;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  }

  async updateSurvey(id: number, surveyData: UpdateSurvey): Promise<Survey | undefined> {
    try {
      const [updatedSurvey] = await db
        .update(surveys)
        .set({
          ...surveyData,
          updatedAt: new Date(),
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
        .where(eq(surveys.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting survey with id ${id}:`, error);
      return false;
    }
  }

  async getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string } }) | undefined> {
    try {
      // First get the survey
      const survey = await this.getSurveyById(id);
      if (!survey) return undefined;
      
      // Then get the author
      const author = await this.getUser(survey.authorId);
      if (!author) return undefined;
      
      // Combine survey with author info
      return {
        ...survey,
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
      
      // Map through surveys and add author information
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private userTeams: Map<number, UserTeam>;
  private surveys: Map<number, Survey>;
  currentId: number;
  currentTeamId: number;
  currentUserTeamId: number;
  currentSurveyId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.userTeams = new Map();
    this.surveys = new Map();
    this.currentId = 1;
    this.currentTeamId = 1;
    this.currentUserTeamId = 1;
    this.currentSurveyId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    email = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    let userToInsert = { ...insertUser };
    
    // Lowercase email for consistency
    if (userToInsert.email) {
      userToInsert.email = userToInsert.email.toLowerCase();
    }
    
    // Hash password if provided
    if (userToInsert.password) {
      userToInsert.password = await this.hashPassword(userToInsert.password);
    }

    const user: User = {
      id,
      ...userToInsert,
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
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }

    let updatedUserData = { ...userData };
    
    // Lowercase email if provided
    if (updatedUserData.email) {
      updatedUserData.email = updatedUserData.email.toLowerCase();
    }
    
    // Hash password if provided
    if (updatedUserData.password) {
      updatedUserData.password = await this.hashPassword(updatedUserData.password);
    }

    const updatedUser: User = {
      ...user,
      ...updatedUserData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = {
      id,
      ...teamData,
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
    for (const team of this.teams.values()) {
      if (team.name === name) {
        return team;
      }
    }
    return undefined;
  }

  async getTeamsByUserId(userId: number): Promise<TeamWithRole[]> {
    const result: TeamWithRole[] = [];
    for (const userTeam of this.userTeams.values()) {
      if (userTeam.userId === userId) {
        const team = this.teams.get(userTeam.teamId);
        if (team) {
          result.push({
            ...team,
            role: userTeam.role,
          });
        }
      }
    }
    return result;
  }

  async addUserToTeam(userTeamData: InsertUserTeam): Promise<UserTeam> {
    const id = this.currentUserTeamId++;
    const userTeam: UserTeam = {
      id,
      ...userTeamData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userTeams.set(id, userTeam);
    return userTeam;
  }

  async updateUserTeams(userId: number, teamIds: number[]): Promise<void> {
    // Get current teams for this user
    const currentUserTeams: UserTeam[] = [];
    for (const userTeam of this.userTeams.values()) {
      if (userTeam.userId === userId) {
        currentUserTeams.push(userTeam);
      }
    }
    
    const currentTeamIds = currentUserTeams.map(ut => ut.teamId);
    
    // Teams to remove (in current but not in new list)
    const teamsToRemove = currentTeamIds.filter(id => !teamIds.includes(id));
    
    // Teams to add (in new list but not in current)
    const teamsToAdd = teamIds.filter(id => !currentTeamIds.includes(id));
    
    // Remove teams
    for (const [key, userTeam] of this.userTeams.entries()) {
      if (userTeam.userId === userId && teamsToRemove.includes(userTeam.teamId)) {
        this.userTeams.delete(key);
      }
    }
    
    // Add new teams
    for (const teamId of teamsToAdd) {
      const id = this.currentUserTeamId++;
      const newUserTeam: UserTeam = {
        id,
        userId,
        teamId,
        role: 'member', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userTeams.set(id, newUserTeam);
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
  
  async verifyGoogleToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      // Verify the Google token by making a request to the tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      
      if (!response.ok) {
        throw new Error(`Google token verification failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as GoogleUserPayload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }
  
  async connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined> {
    try {
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
      const result: Survey[] = [];
      
      // Filter surveys by team ID
      for (const survey of this.surveys.values()) {
        if (survey.teamId === teamId) {
          result.push(survey);
        }
      }
      
      // Sort by updated date descending
      return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting surveys:', error);
      return [];
    }
  }

  async getSurveyById(id: number): Promise<Survey | undefined> {
    try {
      return this.surveys.get(id);
    } catch (error) {
      console.error(`Error getting survey with id ${id}:`, error);
      return undefined;
    }
  }

  async createSurvey(surveyData: InsertSurvey): Promise<Survey> {
    try {
      const id = this.currentSurveyId++;
      
      const survey: Survey = {
        id,
        ...surveyData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: surveyData.status || 'draft',
      };
      
      this.surveys.set(id, survey);
      return survey;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  }

  async updateSurvey(id: number, surveyData: UpdateSurvey): Promise<Survey | undefined> {
    try {
      const currentSurvey = this.surveys.get(id);
      if (!currentSurvey) {
        return undefined;
      }
      
      const updatedSurvey: Survey = {
        ...currentSurvey,
        ...surveyData,
        updatedAt: new Date(),
      };
      
      this.surveys.set(id, updatedSurvey);
      return updatedSurvey;
    } catch (error) {
      console.error(`Error updating survey with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteSurvey(id: number): Promise<boolean> {
    try {
      return this.surveys.delete(id);
    } catch (error) {
      console.error(`Error deleting survey with id ${id}:`, error);
      return false;
    }
  }

  async getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string } }) | undefined> {
    try {
      const survey = this.surveys.get(id);
      if (!survey) return undefined;
      
      const author = this.users.get(survey.authorId);
      if (!author) return undefined;
      
      return {
        ...survey,
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
      const teamSurveys = await this.getSurveys(teamId);
      
      const surveysWithAuthors = teamSurveys.map(survey => {
        const author = this.users.get(survey.authorId);
        return {
          ...survey,
          author: {
            name: author?.name || 'Unknown',
            email: author?.email || 'unknown@example.com'
          }
        };
      });
      
      return surveysWithAuthors;
    } catch (error) {
      console.error(`Error getting surveys with authors for team ${teamId}:`, error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();