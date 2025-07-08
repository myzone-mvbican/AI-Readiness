/**
 * Validation Schemas
 *
 * This file contains Zod validation schemas used for data validation
 * throughout the application. Many schemas are derived from database tables
 * using drizzle-zod, while others are custom-defined for specific use cases.
 *
 * These schemas should be used for:
 * 1. Form validation on the client (with react-hook-form)
 * 2. API input validation on the server
 * 3. Type generation via z.infer<typeof schema>
 */

import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  teams,
  users,
  userTeams,
  surveys,
  surveyTeams,
  assessments,
} from "../schema";

/**
 * User Validation Schemas
 * Schemas for user registration, authentication, and profile updates
 */

// Guest user schema for assessment submissions
export const guestUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  company: true,
  employeeCount: true,
  industry: true,
  googleId: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = createInsertSchema(users)
  .pick({
    name: true,
    company: true,
    employeeCount: true,
    industry: true,
    password: true,
    googleId: true,
  })
  .partial();

/**
 * Google OAuth Authentication Schemas
 * Schemas for handling Google sign-in and account connection
 */
export const googleAuthSchema = z.object({
  credential: z.string(),
});

export const googleConnectSchema = z.object({
  credential: z.string(),
});

/**
 * Team Management Schemas
 * Schemas for team creation and user-team relationships
 */
export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
});

export const userTeamSchema = createInsertSchema(userTeams).pick({
  userId: true,
  teamId: true,
  role: true,
});

/**
 * Survey Management Schemas
 * Schemas for creating, updating, and managing surveys
 */
export const surveyStatusSchema = z.enum(["draft", "public"]).default("draft");

export const surveyVisibilitySchema = z.union([
  z.literal("global"),
  z.array(z.string()).min(1),
]);

export const insertSurveySchema = createInsertSchema(surveys)
  .pick({
    title: true,
    fileReference: true,
    questionsCount: true,
    authorId: true,
    teamId: true,
    status: true,
  })
  .partial({
    teamId: true,
    status: true,
  })
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    status: surveyStatusSchema,
  });

export const updateSurveySchema = createInsertSchema(surveys)
  .pick({
    title: true,
    fileReference: true,
    questionsCount: true,
    teamId: true,
    status: true,
  })
  .partial()
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    status: surveyStatusSchema.optional(),
  });

/**
 * Survey-Team Relationship Schema
 * Schema for managing survey access by teams
 */
export const insertSurveyTeamSchema = createInsertSchema(surveyTeams).pick({
  surveyId: true,
  teamId: true,
});

/**
 * Assessment Schemas
 * Schemas for creating and updating user assessment submissions
 */
export const assessmentStatusSchema = z
  .enum(["draft", "in-progress", "completed"])
  .default("draft");

export const assessmentAnswerSchema = z.object({
  q: z.number(), // question id
  a: z
    .union([
      z.literal(-2),
      z.literal(-1),
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.null(),
    ])
    .optional(), // answer score
  r: z.string().optional(), // recommendation
});

export const insertAssessmentSchema = createInsertSchema(assessments)
  .pick({
    title: true,
    userId: true,
    email: true,
    surveyTemplateId: true,
    status: true,
  })
  .extend({
    userId: z.number().nullable(), // Allow null for guest assessments
    email: z.string().email().optional(), // Required for guest assessments
    status: assessmentStatusSchema,
    answers: z.array(assessmentAnswerSchema),
  });

export const updateAssessmentSchema = createInsertSchema(assessments)
  .pick({
    title: true,
    status: true,
    score: true,
    email: true,
    userId: true,
    recommendations: true,
    pdfPath: true,
    completedOn: true,
  })
  .partial()
  .extend({
    userId: z.number().nullable().optional(), // Allow null for guest assessments
    email: z.string().email().optional(), // For guest assessments
    status: assessmentStatusSchema.optional(),
    answers: z.array(assessmentAnswerSchema).optional(),
    recommendations: z.string().optional(), // Allow storing AI-generated recommendations
    pdfPath: z.string().optional(), // Store relative path to generated PDF
    completedOn: z.date().nullable().optional(), // Allow setting completion timestamp
  });
