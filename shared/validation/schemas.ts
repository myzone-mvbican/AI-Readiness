import { z } from 'zod';

// ===================================
// Survey Schemas
// ===================================

// Survey question schema
export const surveyQuestionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1, "Question text is required"),
  description: z.string().optional().default(''),
  detail: z.string().optional(),
  category: z.string().default('General')
});

// Survey schema
export const surveySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, "Survey title is required"),
  description: z.string().min(1, "Survey description is required"),
  createdAt: z.date(),
  updatedAt: z.date(),
  questionCount: z.number().int().nonnegative().optional()
});

// Survey creation schema (for endpoints)
export const createSurveySchema = z.object({
  title: z.string().min(1, "Survey title is required"),
  description: z.string().min(1, "Survey description is required"),
  fileReference: z.string().optional(),
  teamId: z.number().int().nonnegative().optional().nullable()
});

// ===================================
// Assessment Schemas
// ===================================

// Assessment answer schema
export const assessmentAnswerSchema = z.object({
  q: z.number().int().positive().nullable(),
  a: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.null()
  ])
});

// Assessment schema
export const assessmentSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, "Assessment title is required"),
  status: z.enum(['draft', 'in-progress', 'completed'] as const),
  score: z.number().int().min(0).max(100).nullable(),
  userId: z.string().nullable(),
  guestEmail: z.string().email().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Assessment creation schema (for endpoints)
export const createAssessmentSchema = z.object({
  title: z.string().min(1, "Assessment title is required"),
  surveyId: z.number().int().positive(),
  userId: z.string().optional().nullable(),
  guestData: z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().min(1, "Name is required")
  }).optional()
});

// Assessment answers update schema
export const updateAssessmentAnswersSchema = z.object({
  answers: z.array(assessmentAnswerSchema),
  status: z.enum(['draft', 'in-progress', 'completed'] as const).optional()
});

// ===================================
// Guest User Schemas
// ===================================

// Guest user schema
export const guestUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional()
});

// Guest user creation schema
export const createGuestUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional()
});

// ===================================
// API Response Schema
// ===================================

// Generic API response schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    meta: z.record(z.any()).optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional()
    }).optional()
  });