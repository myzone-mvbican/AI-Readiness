import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";

// Database schema definition
// Only table definitions - types and validation schemas are in separate files

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
  industry: text("industry"), // Now stores NAICS codes like "541511", "31-33", etc.
  password: text("password").notNull(),
  role: text("role").default("client"),
  googleId: text("google_id").unique(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  role: text("role").default("client").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Surveys schema
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileReference: text("file_reference").notNull(),
  questionsCount: integer("questions_count").notNull(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  // Marked as deprecated - using survey_teams junction table instead
  // We keep it as a nullable field for backward compatibility
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("draft").notNull(),
  completionLimit: integer("completion_limit"), // null = unlimited, number = max completions allowed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey-Teams junction table for many-to-many relationship
export const surveyTeams = pgTable(
  "survey_teams",
  {
    id: serial("id").primaryKey(),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
  userId: integer("user_id")
    .references(() => users.id),  // Removed .notNull() to support guest assessments
  guest: text("guest"),  // JSON string of guest user data from localStorage
  surveyTemplateId: integer("survey_template_id")
    .notNull()
    .references(() => surveys.id),
  status: text("status").default("draft").notNull(),
  score: integer("score"),
  answers: text("answers").notNull(), // JSON string of answers array
  recommendations: text("recommendations"), // Store AI-generated recommendations
  completedOn: timestamp("completed_on"), // Timestamp when assessment was completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
