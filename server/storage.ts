import {
  users,
  teams,
  userTeams,
  surveys,
  surveyTeams,
  assessments,
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
  type SurveyTeam,
  type InsertSurveyTeam,
  type Assessment,
  type InsertAssessment,
  type UpdateAssessment,
  type AssessmentAnswer,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, isNull, desc, or } from "drizzle-orm";
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
  getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string }, teams?: { id: number, name: string }[] }) | undefined>;
  getSurveysWithAuthors(teamId: number): Promise<(Survey & { author: { name: string, email: string }, teams: { id: number, name: string }[] })[]>;
  
  // Survey-Team operations
  getSurveyTeams(surveyId: number): Promise<number[]>;
  addSurveyTeam(surveyId: number, teamId: number): Promise<void>;
  removeSurveyTeam(surveyId: number, teamId: number): Promise<void>;
  updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void>;

  // Assessment operations
  getAssessmentsByUserId(userId: number): Promise<Assessment[]>;
  getAssessmentById(id: number): Promise<Assessment | undefined>;
  createAssessment(assessmentData: InsertAssessment): Promise<Assessment>; 
  updateAssessment(id: number, assessmentData: UpdateAssessment): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  getAssessmentWithSurveyInfo(id: number): Promise<(Assessment & { survey: { title: string } }) | undefined>;

  // Authentication operations
  generateToken(user: User): string;
  verifyToken(token: string): { userId: number } | null;
  verifyGoogleToken(token: string): Promise<GoogleUserPayload | null>;
  connectGoogleAccount(userId: number, googleId: string): Promise<User | undefined>;
  disconnectGoogleAccount(userId: number): Promise<User | undefined>;
  isAdmin(email: string): boolean;
}

export class DatabaseStorage implements IStorage {
  // Assessment operations implementation
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    try {
      const result = await db.select().from(assessments)
        .where(eq(assessments.userId, userId))
        .orderBy(desc(assessments.updatedAt));
      
      return result.map(assessment => ({
        ...assessment,
        answers: JSON.parse(assessment.answers)
      }));
    } catch (error) {
      console.error('Error getting assessments:', error);
      return [];
    }
  }

  async getAssessmentById(id: number): Promise<Assessment | undefined> {
    try {
      const [result] = await db.select().from(assessments)
        .where(eq(assessments.id, id));
      
      if (!result) return undefined;
      
      return {
        ...result,
        answers: JSON.parse(result.answers)
      };
    } catch (error) {
      console.error(`Error getting assessment ${id}:`, error);
      return undefined;
    }
  }

  async createAssessment(assessmentData: InsertAssessment): Promise<Assessment> {
    try {
      // Convert answers to JSON string for storage
      const dataToInsert = {
        ...assessmentData,
        answers: JSON.stringify(assessmentData.answers)
      };
      
      const [result] = await db.insert(assessments)
        .values(dataToInsert)
        .returning();
      
      return {
        ...result,
        answers: assessmentData.answers // Use the original typed array
      };
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  async updateAssessment(id: number, assessmentData: UpdateAssessment): Promise<Assessment | undefined> {
    try {
      // Check if assessment exists
      const existingAssessment = await this.getAssessmentById(id);
      if (!existingAssessment) return undefined;
      
      // Prepare update data
      const updateData: any = { ...assessmentData };
      
      // If answers are provided, convert to JSON string
      if (assessmentData.answers) {
        updateData.answers = JSON.stringify(assessmentData.answers);
      }
      
      // Update the record
      const [result] = await db.update(assessments)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(assessments.id, id))
        .returning();
      
      // Return the updated assessment with parsed answers
      return {
        ...result,
        answers: JSON.parse(result.answers)
      };
    } catch (error) {
      console.error(`Error updating assessment ${id}:`, error);
      return undefined;
    }
  }

  async deleteAssessment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assessments)
        .where(eq(assessments.id, id))
        .returning({ id: assessments.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting assessment ${id}:`, error);
      return false;
    }
  }

  async getAssessmentWithSurveyInfo(id: number): Promise<(Assessment & { survey: { title: string } }) | undefined> {
    try {
      const [result] = await db
        .select({
          assessment: assessments,
          surveyTitle: surveys.title
        })
        .from(assessments)
        .innerJoin(surveys, eq(assessments.surveyTemplateId, surveys.id))
        .where(eq(assessments.id, id));
      
      if (!result) return undefined;
      
      return {
        ...result.assessment,
        answers: JSON.parse(result.assessment.answers),
        survey: {
          title: result.surveyTitle
        }
      };
    } catch (error) {
      console.error(`Error getting assessment with survey info ${id}:`, error);
      return undefined;
    }
  }
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
      // First, delete all team associations for this user
      await db
        .delete(userTeams)
        .where(eq(userTeams.userId, id));
      
      // Then, delete any surveys created by this user (or set them to a default user)
      // This depends on your business logic - here we'll delete them
      await db
        .delete(surveys)
        .where(eq(surveys.authorId, id));
        
      // Finally, delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
        
      return !!result;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error; // Rethrow to handle at the route level
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
      if (teamId === 0) {
        // For global surveys (teamId 0), only get surveys with no team assignments
        // First, get all surveys that have team assignments
        const assignedSurveys = await db
          .select({ surveyId: surveyTeams.surveyId })
          .from(surveyTeams);
        
        const assignedSurveyIds = new Set(assignedSurveys.map(s => s.surveyId));
        
        // Return only surveys that are not assigned to any team (truly global)
        return await db
          .select()
          .from(surveys)
          .where(
            and(
              // Only include published surveys
              eq(surveys.status, "public"),
              // Ensure the survey isn't assigned to any teams
              not(inArray(surveys.id, Array.from(assignedSurveyIds)))
            )
          )
          .orderBy(desc(surveys.updatedAt));
      }
      
      // Get surveys visible to this team:
      // 1. Global surveys (no team assignments)
      // 2. Surveys directly linked to the team (legacy)
      // 3. Surveys assigned through the junction table
      
      // Get surveys assigned to teams
      const assignedSurveys = await db
        .select({ surveyId: surveyTeams.surveyId })
        .from(surveyTeams);
        
      const assignedSurveyIds = new Set(assignedSurveys.map(s => s.surveyId));
      
      // Get global surveys (not assigned to any team)
      const globalSurveys = await db
        .select()
        .from(surveys)
        .where(
          and(
            // Only include published surveys
            eq(surveys.status, "public"),
            // Ensure the survey isn't assigned to any teams
            not(inArray(surveys.id, Array.from(assignedSurveyIds)))
          )
        )
        .orderBy(desc(surveys.updatedAt));
      
      // Get surveys assigned to this specific team
      const teamSurveyIds = await db
        .select({ surveyId: surveyTeams.surveyId })
        .from(surveyTeams)
        .where(eq(surveyTeams.teamId, teamId));
      
      // If there are team-specific surveys, fetch them
      let teamSurveys: Survey[] = [];
      if (teamSurveyIds.length > 0) {
        teamSurveys = await db
          .select()
          .from(surveys)
          .where(
            and(
              // Only include published surveys
              eq(surveys.status, "public"),
              // Include surveys assigned to this team
              inArray(surveys.id, teamSurveyIds.map(s => s.surveyId))
            )
          )
          .orderBy(desc(surveys.updatedAt));
      }
      
      // Combine both result sets, ensuring no duplicates
      const allSurveyIds = new Set<number>();
      const uniqueSurveys: Survey[] = [];
      
      // Process global surveys first
      for (const survey of globalSurveys) {
        if (!allSurveyIds.has(survey.id)) {
          allSurveyIds.add(survey.id);
          uniqueSurveys.push(survey);
        }
      }
      
      // Then add team-specific surveys if not already included
      for (const survey of teamSurveys) {
        if (!allSurveyIds.has(survey.id)) {
          allSurveyIds.add(survey.id);
          uniqueSurveys.push(survey);
        }
      }
      
      return uniqueSurveys;
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

  async getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string }, teams?: { id: number, name: string }[] }) | undefined> {
    try {
      // First get the survey
      const survey = await this.getSurveyById(id);
      if (!survey) return undefined;
      
      // Then get the author
      const author = await this.getUser(survey.authorId);
      if (!author) return undefined;
      
      // Get teams for this survey
      const teamIds = await this.getSurveyTeams(survey.id);
      let teams: { id: number, name: string }[] = [];
      
      if (teamIds.length > 0) {
        // Fetch team details for each teamId
        const teamPromises = teamIds.map(async (id) => {
          const team = await this.getTeam(id);
          return team ? { id: team.id, name: team.name } : null;
        });
        
        // Filter out any null teams (those not found)
        teams = (await Promise.all(teamPromises)).filter(Boolean) as { id: number, name: string }[];
      }
      
      // Combine survey with author and teams info
      return {
        ...survey,
        author: {
          name: author.name,
          email: author.email
        },
        teams: teams
      };
    } catch (error) {
      console.error(`Error getting survey with author for id ${id}:`, error);
      return undefined;
    }
  }

  async getSurveysWithAuthors(teamId: number): Promise<(Survey & { author: { name: string, email: string }, teams: { id: number, name: string }[] })[]> {
    try {
      let allSurveys: Survey[] = [];
      
      if (teamId === 0) {
        // For admins, get ALL surveys regardless of team
        const results = await db
          .select()
          .from(surveys)
          .orderBy(desc(surveys.updatedAt));
        allSurveys = results;
      } else {
        // Otherwise, just get surveys for this team and global surveys
        allSurveys = await this.getSurveys(teamId);
      }
      
      // Map through surveys and add author and team information
      const surveysWithAuthors = await Promise.all(
        allSurveys.map(async (survey) => {
          const author = await this.getUser(survey.authorId);
          
          // Get teams for this survey
          const teamIds = await this.getSurveyTeams(survey.id);
          let teams: { id: number, name: string }[] = [];
          
          if (teamIds.length > 0) {
            // Fetch team details for each teamId
            const teamPromises = teamIds.map(async (id) => {
              const team = await this.getTeam(id);
              return team ? { id: team.id, name: team.name } : null;
            });
            
            // Filter out any null teams (those not found)
            teams = (await Promise.all(teamPromises)).filter(Boolean) as { id: number, name: string }[];
          }
          
          return {
            ...survey,
            author: {
              name: author?.name || 'Unknown',
              email: author?.email || 'unknown@example.com'
            },
            teams: teams
          };
        })
      );
      
      return surveysWithAuthors;
    } catch (error) {
      console.error(`Error getting surveys with authors for team ${teamId}:`, error);
      return [];
    }
  }
  // Survey-Team operations
  async getSurveyTeams(surveyId: number): Promise<number[]> {
    try {
      const result = await db
        .select()
        .from(surveyTeams)
        .where(eq(surveyTeams.surveyId, surveyId));
      
      return result.map(st => st.teamId);
    } catch (error) {
      console.error('Error getting survey teams:', error);
      return [];
    }
  }

  async addSurveyTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      await db.insert(surveyTeams).values({
        surveyId,
        teamId,
      });
    } catch (error) {
      console.error('Error adding survey team:', error);
    }
  }

  async removeSurveyTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      await db.delete(surveyTeams)
        .where(and(
          eq(surveyTeams.surveyId, surveyId),
          eq(surveyTeams.teamId, teamId)
        ));
    } catch (error) {
      console.error('Error removing survey team:', error);
    }
  }

  async updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void> {
    try {
      // Begin transaction
      await db.transaction(async (tx) => {
        // Delete all existing survey-team relationships
        await tx.delete(surveyTeams)
          .where(eq(surveyTeams.surveyId, surveyId));
        
        // If there are team IDs, insert the new relationships
        if (teamIds.length > 0) {
          const values = teamIds.map(teamId => ({ 
            surveyId, 
            teamId 
          }));
          
          await tx.insert(surveyTeams).values(values);
        }
      });
    } catch (error) {
      console.error('Error updating survey teams:', error);
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private userTeams: Map<number, UserTeam>;
  private surveys: Map<number, Survey>;
  private surveyTeams: Map<string, { surveyId: number, teamId: number }>;
  private assessments: Map<number, Assessment>;
  currentId: number;
  currentTeamId: number;
  currentUserTeamId: number;
  currentSurveyId: number;
  currentAssessmentId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.userTeams = new Map();
    this.surveys = new Map();
    this.surveyTeams = new Map();
    this.assessments = new Map();
    this.currentId = 1;
    this.currentTeamId = 1;
    this.currentUserTeamId = 1;
    this.currentSurveyId = 1;
    this.currentAssessmentId = 1;
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
      const allSurveys = Array.from(this.surveys.values());
      const result: Survey[] = [];
      
      // If teamId is 0, only return global surveys
      if (teamId === 0) {
        // Get surveys that are marked as global (null teamId) and have no teams assigned
        for (const survey of allSurveys) {
          if (survey.teamId === null) {
            // Further check that survey doesn't have any teams in the junction table
            const surveyTeamIds = await this.getSurveyTeams(survey.id);
            if (surveyTeamIds.length === 0) {
              result.push(survey);
            }
          }
        }
      } else {
        // For a specific team, include:
        // 1. Global surveys (teamId is null and no teams in junction table)
        // 2. Surveys that have the specified teamId
        // 3. Surveys that have an entry in the survey_teams junction table for this team
        
        for (const survey of allSurveys) {
          // Add global surveys
          if (survey.teamId === null) {
            const surveyTeamIds = await this.getSurveyTeams(survey.id);
            if (surveyTeamIds.length === 0) {
              result.push(survey);
              continue;
            }
          }
          
          // Add surveys matching this teamId
          if (survey.teamId === teamId) {
            result.push(survey);
            continue;
          }
          
          // Check the junction table for surveys assigned to this team
          const surveyTeamIds = await this.getSurveyTeams(survey.id);
          if (surveyTeamIds.includes(teamId)) {
            result.push(survey);
          }
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

  async getSurveyWithAuthor(id: number): Promise<(Survey & { author: { name: string, email: string }, teams?: { id: number, name: string }[] }) | undefined> {
    try {
      const survey = this.surveys.get(id);
      if (!survey) return undefined;
      
      const author = this.users.get(survey.authorId);
      if (!author) return undefined;
      
      // Get teams for this survey
      const teamIds = await this.getSurveyTeams(id);
      const teams = teamIds.length > 0 
        ? teamIds.map(teamId => {
            const team = this.teams.get(teamId);
            return team ? { id: team.id, name: team.name } : null;
          }).filter(Boolean) as { id: number, name: string }[]
        : [];
      
      return {
        ...survey,
        author: {
          name: author.name,
          email: author.email
        },
        teams: teams.length > 0 ? teams : undefined
      };
    } catch (error) {
      console.error(`Error getting survey with author for id ${id}:`, error);
      return undefined;
    }
  }

  async getSurveysWithAuthors(teamId: number): Promise<(Survey & { author: { name: string, email: string }, teams?: { id: number, name: string }[] })[]> {
    try {
      let allSurveys: Survey[] = [];
      
      if (teamId === 0) {
        // For admins, get ALL surveys regardless of team
        allSurveys = Array.from(this.surveys.values());
        // Sort by updated date descending
        allSurveys.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      } else {
        // Otherwise, just get surveys for this team and global surveys
        allSurveys = await this.getSurveys(teamId);
      }
      
      // Get all surveys with their authors and teams
      const surveysWithAuthorsAndTeams = await Promise.all(allSurveys.map(async survey => {
        const author = this.users.get(survey.authorId);
        
        // Get teams for this survey
        const teamIds = await this.getSurveyTeams(survey.id);
        const teams = teamIds.length > 0 
          ? teamIds.map(id => {
              const team = this.teams.get(id);
              return team ? { id: team.id, name: team.name } : null;
            }).filter(Boolean) as { id: number, name: string }[]
          : [];
        
        return {
          ...survey,
          author: {
            name: author?.name || 'Unknown',
            email: author?.email || 'unknown@example.com'
          },
          teams: teams
        };
      }));
      
      return surveysWithAuthorsAndTeams;
    } catch (error) {
      console.error(`Error getting surveys with authors for team ${teamId}:`, error);
      return [];
    }
  }
  
  // Survey-Team operations
  async getSurveyTeams(surveyId: number): Promise<number[]> {
    try {
      const teamIds: number[] = [];
      for (const [key, value] of this.surveyTeams.entries()) {
        if (value.surveyId === surveyId) {
          teamIds.push(value.teamId);
        }
      }
      return teamIds;
    } catch (error) {
      console.error('Error getting survey teams:', error);
      return [];
    }
  }

  async addSurveyTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      const key = `${surveyId}-${teamId}`;
      this.surveyTeams.set(key, { surveyId, teamId });
    } catch (error) {
      console.error('Error adding survey team:', error);
    }
  }

  async removeSurveyTeam(surveyId: number, teamId: number): Promise<void> {
    try {
      const key = `${surveyId}-${teamId}`;
      this.surveyTeams.delete(key);
    } catch (error) {
      console.error('Error removing survey team:', error);
    }
  }

  async updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void> {
    try {
      // Remove all existing survey-team associations for this survey
      for (const [key, value] of this.surveyTeams.entries()) {
        if (value.surveyId === surveyId) {
          this.surveyTeams.delete(key);
        }
      }

      // Add new associations
      for (const teamId of teamIds) {
        await this.addSurveyTeam(surveyId, teamId);
      }
    } catch (error) {
      console.error('Error updating survey teams:', error);
    }
  }

  // Assessment operations
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    try {
      const result: Assessment[] = [];
      // Filter assessments by user ID
      for (const assessment of this.assessments.values()) {
        if (assessment.userId === userId) {
          result.push(assessment);
        }
      }
      
      // Sort by updated date descending
      return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting assessments:', error);
      return [];
    }
  }

  async getAssessmentById(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async createAssessment(assessmentData: InsertAssessment): Promise<Assessment> {
    try {
      const id = ++this.currentAssessmentId;
      
      const assessment: Assessment = {
        id,
        title: assessmentData.title,
        userId: assessmentData.userId,
        surveyTemplateId: assessmentData.surveyTemplateId,
        status: assessmentData.status,
        score: null,
        answers: assessmentData.answers,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.assessments.set(id, assessment);
      return assessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  async updateAssessment(id: number, assessmentData: UpdateAssessment): Promise<Assessment | undefined> {
    try {
      const existingAssessment = this.assessments.get(id);
      if (!existingAssessment) return undefined;
      
      const updatedAssessment: Assessment = {
        ...existingAssessment,
        ...assessmentData,
        updatedAt: new Date(),
      };
      
      // Handle answers array separately to preserve existing answers if not provided
      if (assessmentData.answers) {
        updatedAssessment.answers = assessmentData.answers;
      }
      
      this.assessments.set(id, updatedAssessment);
      return updatedAssessment;
    } catch (error) {
      console.error(`Error updating assessment ${id}:`, error);
      return undefined;
    }
  }

  async deleteAssessment(id: number): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async getAssessmentWithSurveyInfo(id: number): Promise<(Assessment & { survey: { title: string } }) | undefined> {
    try {
      const assessment = this.assessments.get(id);
      if (!assessment) return undefined;
      
      const survey = this.surveys.get(assessment.surveyTemplateId);
      if (!survey) return undefined;
      
      return {
        ...assessment,
        survey: {
          title: survey.title
        }
      };
    } catch (error) {
      console.error(`Error getting assessment with survey info ${id}:`, error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();