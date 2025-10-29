/**
 * API Response Types
 * 
 * This file defines standardized response types for all API endpoints.
 * These types ensure consistent response structures throughout the application.
 */

import { 
  User, 
  Team, 
  TeamWithRole, 
  Survey, 
  SurveyWithAuthor, 
  Assessment 
} from './models';

/**
 * Base response interface that all other responses extend
 * @template T Type of data contained in the response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Authentication responses
export interface AuthResponse extends ApiResponse {
  user?: User;
  token?: string;
}

// User responses
export interface UserResponse extends ApiResponse {
  user?: User;
}

export interface UsersResponse extends ApiResponse {
  users?: User[];
}

// Team responses
export interface TeamResponse extends ApiResponse {
  team?: Team;
}

export interface TeamsResponse extends ApiResponse {
  teams?: Team[];
  userTeams?: TeamWithRole[];
}

// Survey responses
export interface SurveyResponse extends ApiResponse {
  survey?: Survey | SurveyWithAuthor;
}

export interface SurveysResponse extends ApiResponse {
  surveys?: Survey[] | SurveyWithAuthor[];
}

// Assessment responses
export interface AssessmentResponse extends ApiResponse {
  assessment?: Assessment;
}

export interface AssessmentsResponse extends ApiResponse {
  assessments?: Assessment[];
}

// NEW STANDARDIZED ASSESSMENT RESPONSES
// These follow the new standard format (Option 4)
import { SuccessResponse, ErrorResponse } from './api-standard';

export type AssessmentsResponseStandard = 
  | SuccessResponse<{ assessments: Assessment[] }>
  | ErrorResponse;

export type AssessmentResponseStandard = 
  | SuccessResponse<{ assessment: Assessment }>
  | ErrorResponse;

/**
 * Guest Assessment responses
 * Specialized response types for guest assessment flows
 */
export interface GuestAssessmentResponse extends ApiResponse {
  assessment?: Assessment;
  upgradeToken?: string; // Optional token to link guest assessment after signup
}

export interface LinkGuestAssessmentsResponse extends ApiResponse {
  linkedCount: number;
  assessments?: Assessment[];
}

// Error responses
export interface ErrorResponse extends ApiResponse {
  error?: string;
}