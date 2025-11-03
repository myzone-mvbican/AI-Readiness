import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

// Database schema definition
// Only table definitions - types and validation schemas are in separate files

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  employeeCount: text("employee_count"),
  industry: text("industry"), // Now stores NAICS codes like "541511", "31-33", etc.
  password: text("password").notNull(),
  role: text("role").default("client"),
  googleId: text("google_id").unique(),
  microsoftId: text("microsoft_id").unique(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  // Password security fields
  passwordHistory: text("password_history").default("[]"), // JSON array of last 12 password hashes
  lastPasswordChange: timestamp("last_password_change", { withTimezone: true }).defaultNow(),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until", { withTimezone: true }),
  passwordStrength: text("password_strength").default("unknown"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  role: text("role").default("client").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Surveys schema
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileReference: text("file_reference"), // Nullable - no longer used since we store questions in database
  questionsCount: integer("questions_count").notNull(),
  questions: jsonb("questions").$type<Array<{ id: number; question: string; category: string; details: string }>>(), // JSONB array of CsvQuestion objects
  authorId: integer("author_id").notNull().references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("draft").notNull(),
  completionLimit: integer("completion_limit"), // null = unlimited, number = max completions allowed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Survey-Teams junction table for many-to-many relationship
export const surveyTeams = pgTable(
  "survey_teams",
  {
    id: serial("id").primaryKey(),
    surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      unq: uniqueIndex("survey_team_unq").on(table.surveyId, table.teamId),
    };
  },
);

// Assessment schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id),  // Removed .notNull() to support guest assessments
  guest: text("guest"),  // JSON string of guest user data from localStorage
  email: text("email"), // Store email for guest assessments
  surveyTemplateId: integer("survey_template_id").notNull().references(() => surveys.id),
  status: text("status").default("draft").notNull(),
  score: integer("score"),
  answers: text("answers").notNull(), // JSON string of answers array
  recommendations: text("recommendations"), // Store AI-generated recommendations
  pdfPath: text("pdf_path"), // Store relative path to generated PDF file
  completedOn: timestamp("completed_on", { withTimezone: true }), 
  // Timestamp when assessment was completed with timezone
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Survey Statistics for benchmarking
export const surveyStats = pgTable("survey_stats", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(), // Now uses NAICS codes like "541511", "31-33", or "global"
  category: text("category").notNull(), // e.g., "Strategy", "Data & Analytics"
  quarter: text("quarter").notNull(), // e.g., "2025-Q2"
  averageScore: integer("average_score").notNull(), // Average score for this category/industry/quarter
  completedCount: integer("completed_count").notNull(), // Number of assessments included
  segmentKey: text("segment_key"), // Optional for future segmentation (e.g., "industry|region")
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Unique constraint to prevent duplicate stats for same industry/category/quarter
    industryQuarterUnique: unique("survey_stats_industry_category_quarter_unq").on(
      table.industry,
      table.category,
      table.quarter
    ),
  };
});
