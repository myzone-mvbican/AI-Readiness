/**
 * Core Data Models
 *
 * This file contains the core data model types derived from database schema definitions.
 * These types represent the fundamental data entities used throughout the application.
 */

// Import core types from the schema
import {
  teams,
  users,
  userTeams,
  surveys,
  surveyTeams,
  assessments,
} from "../schema";

// Basic database model types
export type Team = typeof teams.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserTeam = typeof userTeams.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SurveyTeam = typeof surveyTeams.$inferSelect;

// Define the assessment question type
export type CsvQuestion = {
  id: number;
  question: string;
  category: string;
  details: string;
};

export type CsvValidationResult = {
  isValid: boolean;
  errors: string[];
  questionsCount: number;
};

export type CsvParseResult = {
  isValid: boolean;
  errors: string[];
  questions: CsvQuestion[];
};

// Define the assessment answer type
export type AssessmentAnswer = {
  q: number;
  a?: -2 | -1 | 0 | 1 | 2 | null;
  r?: string;
};

// For assessment, we have two types: the DB type and the runtime type
export type AssessmentDB = typeof assessments.$inferSelect;
export type Assessment = Omit<AssessmentDB, "answers"> & {
  answers: Array<AssessmentAnswer>;
  completedOn?: Date | null;
};

// Combined types for frontend use
export type TeamWithRole = Team & { role: string };

/**
 * Extended model types for domain-specific entities
 */
export type SurveyWithAuthor = Survey & {
  author: {
    name: string;
    email: string;
  };
  teams?: {
    id: number;
    name: string;
  }[];
};

/**
 * Guest User type for anonymous assessment submissions
 */
export interface GuestUser {
  name: string;
  email: string;
  company?: string;
}

/**
 * Guest Assessment represents an assessment completed by a non-registered user
 */
export type GuestAssessment = Omit<Assessment, "userId"> & {
  userId: null;
  email: string;
};

// Google OAuth decoded payload
export interface GoogleUserPayload {
  iss: string;
  nbf: number;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  azp: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}
