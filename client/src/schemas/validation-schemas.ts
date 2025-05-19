import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(50, { message: "Name cannot exceed 50 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    company: z.string().min(1, { message: "Company name is required" }),
    employeeCount: z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"], {
      errorMap: () => ({ message: "Please select your company size" }),
    }),
    industry: z.enum([
      "technology",
      "healthcare",
      "finance",
      "retail",
      "manufacturing",
      "education",
      "government",
      "energy",
      "transportation",
      "other",
    ], {
      errorMap: () => ({ message: "Please select your industry" }),
    }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
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

    industry: z
      .enum([
        "technology",
        "healthcare",
        "finance",
        "retail",
        "manufacturing",
        "education",
        "government",
        "energy",
        "transportation",
        "other",
      ])
      .optional(),

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
  company: z.string().optional(),
});

export type GuestAssessmentFormValues = z.infer<typeof guestAssessmentFormSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
