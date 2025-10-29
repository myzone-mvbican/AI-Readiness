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

// Define the assessment answer type with discriminated unions for better type safety
export type AssessmentAnswer = 
  | { q: number; type: 'scale'; a: -2 | -1 | 0 | 1 | 2; r?: string }
  | { q: number; type: 'text'; a?: never; r: string }
  | { q: number; type: 'skipped'; a: null; r?: string }
  | { q: number; type: 'unanswered'; a?: never; r?: never };

// Legacy answer type for backward compatibility with existing data
export type LegacyAssessmentAnswer = {
  q: number;
  a?: -2 | -1 | 0 | 1 | 2 | null;
  r?: string;
};

// For assessment, we have two types: the DB type and the runtime type
export type AssessmentDB = typeof assessments.$inferSelect;
export type Assessment = Omit<AssessmentDB, "answers"> & {
  answers: Array<AssessmentAnswer | LegacyAssessmentAnswer>;
  completedOn?: Date | null;
};

// Type guard functions for assessment answers
export function isScaleAnswer(answer: AssessmentAnswer | LegacyAssessmentAnswer): answer is Extract<AssessmentAnswer, { type: 'scale' }> {
  return 'type' in answer && answer.type === 'scale';
}

export function isTextAnswer(answer: AssessmentAnswer | LegacyAssessmentAnswer): answer is Extract<AssessmentAnswer, { type: 'text' }> {
  return 'type' in answer && answer.type === 'text';
}

export function isSkippedAnswer(answer: AssessmentAnswer | LegacyAssessmentAnswer): answer is Extract<AssessmentAnswer, { type: 'skipped' }> {
  return 'type' in answer && answer.type === 'skipped';
}

export function isLegacyAnswer(answer: AssessmentAnswer | LegacyAssessmentAnswer): answer is LegacyAssessmentAnswer {
  return !('type' in answer);
}

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
  employeeCount?: string;
  industry?: string;
}

/**
 * Guest Assessment represents an assessment completed by a non-registered user
 */
export type GuestAssessment = Omit<Assessment, "userId"> & {
  userId: null;
  email: string;
};

/**
 * Benchmark Data Types
 */
export interface BenchmarkData {
  quarter: string;
  industry: string;
  categories: {
    name: string;
    userScore: number;
    industryAverage: number | null;
    globalAverage: number | null;
  }[];
}

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
