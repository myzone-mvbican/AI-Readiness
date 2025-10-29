import { z } from "zod";
import { industrySchema } from "@/lib/industry-validation";

// Team data type
export type Team = {
  id: number;
  name: string;
  role: string;
};

// User data type
export type User = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  employeeCount: string | null;
  industry: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  teams: Team[];
};

// Form schema for editing users
export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).readonly(),
  company: z.string().nullable().optional(),
  employeeCount: z.string().nullable().optional(),
  industry: industrySchema.nullable().optional(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UserFormValues = z.infer<typeof userFormSchema>;

// API response types
export type UsersResponse = {
  success: boolean;
  data: User[];
  metadata: {
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
};

export type TeamsResponse = {
  success: boolean;
  teams: Team[];
};