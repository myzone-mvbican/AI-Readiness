import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  
  email: z.string()
    .email({ message: "Please enter a valid email address" }),
  
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  
  email: z.string()
    .email({ message: "Please enter a valid email address" }),
  
  company: z.string()
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(100, { message: "Company name cannot exceed 100 characters" }),
  
  employeeCount: z.string({
    required_error: "Please select number of employees",
  }),
  
  industry: z.string({
    required_error: "Please select your industry",
  }),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
