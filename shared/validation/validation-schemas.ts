import { z } from "zod";
import { industrySchema } from "@/lib/industry-validation";

/**
 * Enhanced Zod validation schemas for authentication
 * Used with React Hook Form for comprehensive form validation
 */

// Email validation - normalization handled in form submission
const emailSchema = z
  .string()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" });

// Password validation with comprehensive rules
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Password must contain at least one special character",
  });

// Name validation
const nameSchema = z
  .string()
  .min(1, { message: "Name is required" })
  .min(2, { message: "Name must be at least 2 characters" })
  .max(50, { message: "Name cannot exceed 50 characters" });

// Company name validation
const companySchema = z
  .string()
  .min(1, { message: "Company name is required" })
  .min(2, { message: "Company name must be at least 2 characters" })
  .max(100, { message: "Company name cannot exceed 100 characters" });

// Employee count enum validation
const employeeCountSchema = z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"], {
  errorMap: () => ({ message: "Please select your company size" }),
});

/**
 * Signup/Registration Schema
 * Validates all required fields for user registration
 */
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    company: companySchema,
    employeeCount: employeeCountSchema,
    industry: industrySchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Login Schema
 * Validates email and password for user authentication
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export const settingsSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(50, { message: "Name cannot exceed 50 characters" }),

    company: z.string().optional().or(z.literal("")),

    employeeCount: z
      .enum(["1-9", "10-49", "50-249", "250-999", "1000+"])
      .optional(),

    industry: industrySchema.optional(),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character",
      })
      .optional()
      .or(z.literal("")),

    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const guestAssessmentFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().min(1, { message: "Company name is required" }),
  employeeCount: z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"], {
    errorMap: () => ({ message: "Please select your company size" }),
  }),
  industry: industrySchema,
});

export type GuestAssessmentFormValues = z.infer<
  typeof guestAssessmentFormSchema
>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
