/**
 * This file contains shared type definitions used across the application.
 */

// ===================================
// User Types
// ===================================

export interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
  employeeCount: number | null;
  industry: string | null;
  role: string | null;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestUser {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

// ===================================
// Team Types
// ===================================

export interface Team {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTeam {
  userId: string;
  teamId: number;
  role: string;
  createdAt: Date;
}

// ===================================
// Survey Types
// ===================================

export interface Survey {
  id: number;
  title: string;
  description: string;
  fileReference: string | null;
  questionCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurveyQuestion {
  number: number;
  text: string;
  description: string | null;
  detail: string | null;
  category: string;
}

export interface SurveyTeam {
  surveyId: number;
  teamId: number;
  createdAt: Date;
}

// ===================================
// Assessment Types
// ===================================

export type AssessmentStatus = 'draft' | 'in-progress' | 'completed';

/**
 * Answer values:
 * -2 = Strongly Disagree
 * -1 = Disagree
 *  0 = Neutral
 *  1 = Agree
 *  2 = Strongly Agree
 *  null = Not Answered
 */
export interface AssessmentAnswer {
  q: number | null; // Question number
  a: -2 | -1 | 0 | 1 | 2 | null; // Answer value
}

export interface Assessment {
  id: number;
  title: string;
  surveyId: number;
  status: AssessmentStatus;
  score: number | null;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  company: string | null;
  teamId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===================================
// API Response Types
// ===================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ===================================
// Authentication Types
// ===================================

export interface GoogleUserPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  token: AuthToken;
}