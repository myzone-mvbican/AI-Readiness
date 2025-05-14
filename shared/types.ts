import { z } from 'zod';

// =======================================
// Shared type definitions for our API
// =======================================

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// =======================================
// User Types
// =======================================

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  teamId: number | null;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestUser {
  id: string; // UUID for guest users
  name: string;
  email: string;
  company?: string;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

// =======================================
// Team Types
// =======================================

export interface Team {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// =======================================
// Survey Types
// =======================================

export interface Survey {
  id: number;
  title: string;
  description: string;
  fileReference: string;
  teamId: number | null; // null means it's a global survey
  createdAt: Date;
  updatedAt: Date;
}

export const createSurveySchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500),
  teamId: z.number().nullable().optional(),
  fileReference: z.string().optional()
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export interface SurveyQuestion {
  id: number;
  surveyId: number;
  questionNumber: number;
  text: string;
  category: string;
  subCategory?: string;
  weight: number;
}

// =======================================
// Assessment Types
// =======================================

export enum AssessmentStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Assessment {
  id: number;
  title: string;
  surveyId: number;
  userId: string | null; // null for guest assessments
  guestData?: {
    name: string;
    email: string;
  };
  status: AssessmentStatus;
  progress: number; // 0-100
  score: number | null; // 0-100, null if not completed
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export const createAssessmentSchema = z.object({
  title: z.string().min(3).max(100),
  surveyId: z.number(),
  userId: z.string().nullable().optional(),
  guestData: z.object({
    name: z.string(),
    email: z.string().email()
  }).optional()
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export interface AssessmentAnswer {
  id?: number;
  assessmentId: number;
  q: number; // question number
  a: -2 | -1 | 0 | 1 | 2 | null; // answer value
}

export const assessmentAnswerSchema = z.object({
  q: z.number(),
  a: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(null)
  ])
});

export const saveAnswersSchema = z.object({
  answers: z.array(assessmentAnswerSchema)
});

export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;

// =======================================
// Analytics Types
// =======================================

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AssessmentResult {
  id: number;
  title: string;
  overallScore: number;
  completedAt: Date;
  categoryScores: CategoryScore[];
}

// =======================================
// Misc Types
// =======================================

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}