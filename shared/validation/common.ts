/**
 * Consolidated Form Validation
 * 
 * Centralized validation schemas and utilities to eliminate duplication
 * across authentication, assessment, and administrative forms.
 */

import { z } from "zod";

/**
 * Industry validation with dynamic import support
 */
export const createIndustrySchema = () => {
  // Industry codes as used in the database (NAICS format)
  const industryOptions = [
    "541511", // Technology / Software
    "621111", // Healthcare
    "524210", // Finance / Insurance  
    "454110", // Retail
    "31-33",   // Manufacturing
    "611310", // Education
    "921190", // Government
    "221118", // Energy / Utilities
    "484121", // Transportation
    "999999"  // Other
  ] as const;

  return z.enum(industryOptions, {
    errorMap: () => ({ message: "Please select a valid industry" })
  });
};

/**
 * Common field validators used across multiple forms
 */
export const commonValidators = {
  // User authentication fields
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),

  confirmPassword: (passwordField: string) => z
    .string()
    .min(1, { message: "Please confirm your password" }),

  // Company/organization fields
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),

  company: z
    .string()
    .min(1, { message: "Company name is required" })
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(100, { message: "Company name must be less than 100 characters" }),

  employeeCount: z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"], {
    errorMap: () => ({ message: "Please select an employee count range" })
  }),

  industry: createIndustrySchema(),

  // Survey/assessment fields
  surveyTitle: z
    .string()
    .min(1, { message: "Survey title is required" })
    .min(3, { message: "Survey title must be at least 3 characters" })
    .max(200, { message: "Survey title must be less than 200 characters" }),

  surveyDescription: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),

  teamId: z
    .number()
    .int()
    .positive({ message: "Please select a valid team" }),

  // File upload validation
  csvFile: z
    .instanceof(File, { message: "Please select a CSV file" })
    .refine(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv"),
      { message: "File must be a CSV format" }
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      { message: "File size must be less than 5MB" }
    ),

  // Assessment response validation
  assessmentAnswer: z.union([
    z.literal(-2),
    z.literal(-1), 
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.null()
  ], { errorMap: () => ({ message: "Please select a valid response" }) }),

  assessmentComment: z
    .string()
    .max(500, { message: "Comment must be less than 500 characters" })
    .optional()
};

/**
 * Compound validation schemas for complete forms
 */
export const authSchemas = {
  login: z.object({
    email: commonValidators.email,
    password: z.string().min(1, { message: "Password is required" })
  }),

  register: z.object({
    name: commonValidators.name,
    email: commonValidators.email,
    company: commonValidators.company,
    employeeCount: commonValidators.employeeCount,
    industry: commonValidators.industry,
    password: commonValidators.password,
    confirmPassword: commonValidators.confirmPassword("password")
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  // Guest assessment without password requirements
  guestAssessment: z.object({
    name: commonValidators.name,
    email: commonValidators.email,
    company: commonValidators.company,
    employeeCount: commonValidators.employeeCount,
    industry: commonValidators.industry
  })
};

export const surveySchemas = {
  create: z.object({
    title: commonValidators.surveyTitle,
    description: commonValidators.surveyDescription,
    csvFile: commonValidators.csvFile,
    selectedTeams: z.array(z.number()).min(1, { message: "Please select at least one team" })
  }),

  update: z.object({
    title: commonValidators.surveyTitle,
    description: commonValidators.surveyDescription,
    selectedTeams: z.array(z.number()).min(1, { message: "Please select at least one team" })
  })
};

export const assessmentSchemas = {
  create: z.object({
    surveyId: z.number().int().positive({ message: "Please select a valid survey" }),
    teamId: commonValidators.teamId
  }),

  answer: z.object({
    questionId: z.number().int().positive(),
    answer: commonValidators.assessmentAnswer,
    comment: commonValidators.assessmentComment
  })
};

/**
 * Settings and profile schemas
 */
export const settingsSchemas = {
  profile: z.object({
    name: commonValidators.name,
    email: commonValidators.email,
    company: commonValidators.company,
    employeeCount: commonValidators.employeeCount,
    industry: commonValidators.industry
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: commonValidators.password,
    confirmPassword: commonValidators.confirmPassword("newPassword")
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

/**
 * Type inference helpers
 */
export type LoginFormValues = z.infer<typeof authSchemas.login>;
export type RegisterFormValues = z.infer<typeof authSchemas.register>;
export type GuestAssessmentFormValues = z.infer<typeof authSchemas.guestAssessment>;
export type SurveyCreateFormValues = z.infer<typeof surveySchemas.create>;
export type SurveyUpdateFormValues = z.infer<typeof surveySchemas.update>;
export type AssessmentCreateFormValues = z.infer<typeof assessmentSchemas.create>;
export type AssessmentAnswerFormValues = z.infer<typeof assessmentSchemas.answer>;
export type ProfileFormValues = z.infer<typeof settingsSchemas.profile>;
export type ChangePasswordFormValues = z.infer<typeof settingsSchemas.changePassword>;

/**
 * Validation utilities
 */
export const validationUtils = {
  // Transform industry display name to code for database storage
  industryNameToCode: (displayName: string): string => {
    const mapping: Record<string, string> = {
      "Technology / Software": "541511",
      "Healthcare": "621111", 
      "Finance / Insurance": "524210",
      "Retail": "454110",
      "Manufacturing": "31-33",
      "Education": "611310",
      "Government": "921190",
      "Energy / Utilities": "221118",
      "Transportation": "484121",
      "Other": "999999"
    };
    return mapping[displayName] || displayName;
  },

  // Transform industry code to display name for UI
  industryCodeToName: (code: string): string => {
    const mapping: Record<string, string> = {
      "541511": "Technology / Software",
      "621111": "Healthcare",
      "524210": "Finance / Insurance", 
      "454110": "Retail",
      "31-33": "Manufacturing",
      "611310": "Education",
      "921190": "Government",
      "221118": "Energy / Utilities",
      "484121": "Transportation",
      "999999": "Other"
    };
    return mapping[code] || code;
  },

  // Get industry options for dropdowns
  getIndustryOptions: () => [
    { value: "541511", label: "Technology / Software" },
    { value: "621111", label: "Healthcare" },
    { value: "524210", label: "Finance / Insurance" },
    { value: "454110", label: "Retail" },
    { value: "31-33", label: "Manufacturing" },
    { value: "611310", label: "Education" },
    { value: "921190", label: "Government" },
    { value: "221118", label: "Energy / Utilities" },
    { value: "484121", label: "Transportation" },
    { value: "999999", label: "Other" }
  ]
};