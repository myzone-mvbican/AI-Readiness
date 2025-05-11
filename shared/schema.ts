import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
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
  // Marked as deprecated - using survey_teams junction table instead
  // We keep it as a nullable field for backward compatibility
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey-Teams junction table for many-to-many relationship
export const surveyTeams = pgTable("survey_teams", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: uniqueIndex('survey_team_unq').on(table.surveyId, table.teamId),
  };
});

// Survey-Teams schema
export const insertSurveyTeamSchema = createInsertSchema(surveyTeams).pick({
  surveyId: true,
  teamId: true,
});

// Survey validation schemas
export const surveyStatusSchema = z.enum(["draft", "public"]).default("draft");

export const surveyVisibilitySchema = z.union([
  z.literal("global"),
  z.array(z.string()).min(1)
]);

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
}).extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  status: surveyStatusSchema,
});

export const updateSurveySchema = createInsertSchema(surveys).pick({
  title: true,
  fileReference: true,
  questionsCount: true,
  teamId: true,
  status: true,
}).partial().extend({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  status: surveyStatusSchema.optional(),
});

// Survey types
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type UpdateSurvey = z.infer<typeof updateSurveySchema>;

// Survey-Team types
export type SurveyTeam = typeof surveyTeams.$inferSelect;
export type InsertSurveyTeam = z.infer<typeof insertSurveyTeamSchema>;

// Assessment schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  surveyTemplateId: integer("survey_template_id").notNull().references(() => surveys.id),
  status: text("status").default("draft").notNull(),
  score: integer("score"),
  answers: text("answers").notNull(), // JSON string of answers array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assessment validation schemas
export const assessmentStatusSchema = z.enum(["draft", "in-progress", "completed"]).default("draft");

export const assessmentAnswerSchema = z.object({
  q: z.string(), // question id
  a: z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2), z.null()]).optional(), // answer score
  r: z.string().optional(), // recommendation
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  userId: true,
  surveyTemplateId: true,
  status: true,
}).extend({
  status: assessmentStatusSchema,
  answers: z.array(assessmentAnswerSchema),
});

export const updateAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  status: true,
  score: true,
}).partial().extend({
  status: assessmentStatusSchema.optional(),
  answers: z.array(assessmentAnswerSchema).optional(),
});

// Assessment types
export type Assessment = typeof assessments.$inferSelect & { 
  answers: Array<z.infer<typeof assessmentAnswerSchema>> 
};
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type UpdateAssessment = z.infer<typeof updateAssessmentSchema>;
export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>;
