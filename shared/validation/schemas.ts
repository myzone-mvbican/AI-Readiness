import { z } from 'zod';

// ===================================
// User Authentication Schemas
// ===================================

// User signup/registration schema
export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company: z.string().optional(),
  employeeCount: z.number().int().positive().optional(),
  industry: z.string().optional(),
  role: z.string().optional(),
  googleId: z.string().optional()
});

// User update schema
export const updateUserSchema = insertUserSchema.partial();

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required")
});

// Google auth schema
export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required")
});

// Google connect schema
export const googleConnectSchema = z.object({
  credential: z.string().min(1, "Google credential is required")
});

// ===================================
// Team Schemas
// ===================================

// Team schema
export const insertTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional()
});

// User-team relation schema
export const userTeamSchema = z.object({
  userId: z.number().int().positive(),
  teamId: z.number().int().positive(),
  role: z.string().min(1, "Role is required")
});

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

// Alternative names for backward compatibility
export const insertSurveySchema = createSurveySchema;
export const updateSurveySchema = createSurveySchema.partial();

// Survey team relation schema
export const insertSurveyTeamSchema = z.object({
  surveyId: z.number().int().positive(),
  teamId: z.number().int().positive()
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

// Alternative names for backward compatibility
export const insertAssessmentSchema = createAssessmentSchema;
export const updateAssessmentSchema = createAssessmentSchema.partial();

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