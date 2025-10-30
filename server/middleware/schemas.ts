/**
 * Validation Schemas for Middleware
 * 
 * Common Zod schemas for request validation
 */

import { z } from "zod";

/**
 * Common parameter validation schemas
 */
export const idParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) {
      throw new Error("Invalid ID format");
    }
    return num;
  })
});

export const teamIdParamSchema = z.object({
  teamId: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) {
      throw new Error("Invalid team ID format");
    }
    return num;
  })
});

export const userIdParamSchema = z.object({
  userId: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) {
      throw new Error("Invalid user ID format");
    }
    return num;
  })
});

/**
 * Pagination query schemas
 */
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  pageSize: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

/**
 * User search query schema for admin user listing
 */
export const userSearchQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  sortBy: z.literal("createdAt").optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

/**
 * Email query schema for user existence check
 */
export const emailQuerySchema = z.object({
  email: z.string().email("Valid email is required")
});

/**
 * User search by name/email query schema
 */
export const userSearchByNameQuerySchema = z.object({
  q: z.string().min(2, "Search term must be at least 2 characters").optional()
});

/**
 * Assessment query schema
 */
export const assessmentQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  pageSize: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

/**
 * Survey query schema
 */
export const surveyQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  pageSize: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

/**
 * Team creation schema
 */
export const teamCreationSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional()
});

/**
 * User team assignment schema
 */
export const userTeamAssignmentSchema = z.object({
  userId: z.number().positive("User ID must be positive"),
  role: z.enum(["admin", "member"]).optional().default("member")
});

/**
 * User role update schema
 */
export const userRoleUpdateSchema = z.object({
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be either 'admin' or 'member'" })
  })
});

/**
 * User teams update schema
 */
export const userTeamsUpdateSchema = z.object({
  teamIds: z.array(z.number().positive("Team ID must be positive"))
});

/**
 * Assessment creation schema
 */
export const assessmentCreationSchema = z.object({
  surveyTemplateId: z.number().positive("Survey template ID is required")
});


/**
 * Guest assessment creation schema
 */
export const guestAssessmentCreationSchema = z.object({
  surveyTemplateId: z.number().positive("Survey template ID is required"),
  guestName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestCompany: z.string().optional(),
  guestIndustry: z.string().optional(),
  answers: z.array(z.any()).optional()
});

/**
 * Guest assessment update schema
 */
export const guestAssessmentUpdateSchema = z.object({
  recommendations: z.string().min(1, "Recommendations are required")
});

/**
 * Completion eligibility schema
 */
export const completionEligibilitySchema = z.object({
  guestEmail: z.string().email("Valid email is required").optional()
});

/**
 * AI suggestion schema
 */
export const aiSuggestionSchema = z.object({
  assessment: z.object({
    id: z.number(),
    userId: z.number().nullable().optional(),
    guest: z.string().nullable().optional(),
    answers: z.array(z.any()),
    surveyTemplateId: z.number(),
    status: z.string().optional(),
    score: z.number().optional(),
    survey: z.object({
      id: z.number(),
      title: z.string(),
      questionsCount: z.number(),
      completionLimit: z.number().nullable().optional(),
      questions: z.array(z.any()).optional()
    }).optional()
  }).passthrough() // Allow additional fields to pass through
});

/**
 * Industry analysis schema
 */
export const industryAnalysisSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        return ["http:", "https:"].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    }, "URL must use HTTP or HTTPS protocol")
});

/**
 * Password Reset Schemas
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const tokenQuerySchema = z.object({
  token: z.string().min(1, "Token is required")
});

/**
 * Guest Assessment Data Schema
 */
export const guestAssessmentDataSchema = z.object({
  surveyId: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid survey ID");
    return num;
  }),
  answers: z.array(z.any()).min(1, "Answers are required"),
  guestData: z.object({
    name: z.string().min(1, "Guest name is required"),
    email: z.string().email("Valid email is required"),
    company: z.string().optional(),
    industry: z.string().optional()
  })
});

/**
 * Survey Update Schema
 */
export const surveyUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  status: z.enum(["draft", "public"]).optional(),
  completionLimit: z.union([
    z.literal(""), // Allow empty string to be converted to null
    z.string().refine(val => {
      if (val === "") return true;
      const parsed = parseInt(val);
      return !isNaN(parsed) && parsed > 0;
    }, "Completion limit must be a positive number"),
    z.number().positive("Completion limit must be positive"),
    z.null()
  ]).optional().transform(val => {
    if (val === "" || val === null) return null;
    if (typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }),
  teamIds: z.union([
    z.literal(""), // Allow empty string for global surveys
    z.literal("global"),
    z.string().refine(val => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }, "teamIds must be a valid JSON array"),
    z.array(z.number().positive("Team ID must be positive"))
  ]).optional().transform(val => {
    if (val === "" || val === "global") return [];
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return val;
  }),
  questionsCount: z.coerce.number().positive("Questions count must be positive").optional()
});

/**
 * Assessment Update Schema
 */
export const assessmentUpdateSchema = z.object({
  answers: z.array(z.any()).optional(),
  status: z.enum(["draft", "in-progress", "completed"]).optional(),
  recommendations: z.string().optional(),
  score: z.number().optional(),
  completedOn: z.string().datetime().optional()
});