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

// User request types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GoogleConnectInput = z.infer<typeof googleConnectSchema>;

// Team request types
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertUserTeam = z.infer<typeof userTeamSchema>;

// Survey request types
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type UpdateSurvey = z.infer<typeof updateSurveySchema>;
export type InsertSurveyTeam = z.infer<typeof insertSurveyTeamSchema>;

// Assessment request types
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type UpdateAssessment = z.infer<typeof updateAssessmentSchema>;

// Authentication request types
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