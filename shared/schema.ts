import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  employeeCount: text("employee_count"),
  industry: text("industry"),
  password: text("password").notNull(),
  role: text("role").default("client"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  role: text("role").default("client").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Schema for Google OAuth login/signup
export const googleAuthSchema = z.object({
  credential: z.string(),
});

// Schema for Google account connect/disconnect
export const googleConnectSchema = z.object({
  credential: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = createInsertSchema(users).pick({
  name: true,
  company: true,
  employeeCount: true,
  industry: true,
  password: true,
  googleId: true,
}).partial();

// Team schemas
export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
});

export const userTeamSchema = createInsertSchema(userTeams).pick({
  userId: true,
  teamId: true,
  role: true,
});

// Team types
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UserTeam = typeof userTeams.$inferSelect;
export type InsertUserTeam = z.infer<typeof userTeamSchema>;

// User types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GoogleConnectInput = z.infer<typeof googleConnectSchema>;

// Combined types for frontend use
export type TeamWithRole = Team & { role: string };

// Google OAuth decoded payload
export interface GoogleUserPayload {
  iss: string;
  nbf: number;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  azp: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}

// Surveys schema
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileReference: text("file_reference").notNull(),
  questionsCount: integer("questions_count").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey schemas
export const insertSurveySchema = createInsertSchema(surveys).pick({
  title: true,
  fileReference: true,
  questionsCount: true,
  authorId: true,
  teamId: true,
  status: true,
}).partial({
  teamId: true,
  status: true,
});

export const updateSurveySchema = createInsertSchema(surveys).pick({
  title: true,
  fileReference: true,
  questionsCount: true,
  status: true,
}).partial();

// Survey types
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type UpdateSurvey = z.infer<typeof updateSurveySchema>;
