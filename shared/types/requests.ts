/**
 * API Request Types
 * 
 * This file defines request types used for API input validation.
 * Most types are derived from Zod schemas to ensure consistent validation
 * between client and server.
 */

import { z } from "zod";
import { 
  insertUserSchema,
  loginSchema,
  googleAuthSchema,
  googleConnectSchema,
  insertTeamSchema,
  userTeamSchema,
  insertSurveySchema, 
  updateSurveySchema,
  insertSurveyTeamSchema,
  insertAssessmentSchema,
  updateAssessmentSchema,
  updateUserSchema
} from "../validation/schemas";

/**
 * User Management
 * Types for user creation, authentication, and profile management
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GoogleConnectInput = z.infer<typeof googleConnectSchema>;

/**
 * Team Management
 * Types for team creation and user-team relationships
 */
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertUserTeam = z.infer<typeof userTeamSchema>;

/**
 * Survey Management
 * Types for creating and updating surveys and survey-team relationships
 */
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type UpdateSurvey = z.infer<typeof updateSurveySchema>;
export type InsertSurveyTeam = z.infer<typeof insertSurveyTeamSchema>;

/**
 * Assessment Management
 * Types for creating and updating user assessments
 */
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type UpdateAssessment = z.infer<typeof updateAssessmentSchema>;

/**
 * Legacy Authentication Types
 * Direct interface definitions for authentication endpoints
 * These complement the Zod-derived types above
 */
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
  company?: string;
  employeeCount?: string;
  industry?: string;
}

export interface GoogleLoginData {
  credential: string;
}