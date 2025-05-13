import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { teams, users, userTeams, surveys, surveyTeams, assessments } from "../schema";

// User validation schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  company: true,
  employeeCount: true,
  industry: true,
  googleId: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = createInsertSchema(users)
  .pick({
    name: true,
    company: true,
    employeeCount: true,
    industry: true,
    password: true,
    googleId: true,
  })
  .partial();

// Google auth schemas
export const googleAuthSchema = z.object({
  credential: z.string(),
});

export const googleConnectSchema = z.object({
  credential: z.string(),
});

// Team schemas
export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
});

export const userTeamSchema = createInsertSchema(userTeams).pick({
  userId: true,
  teamId: true,
  role: true,
});

// Survey validation schemas
export const surveyStatusSchema = z.enum(["draft", "public"]).default("draft");

export const surveyVisibilitySchema = z.union([
  z.literal("global"),
  z.array(z.string()).min(1),
]);

// Survey schemas
export const insertSurveySchema = createInsertSchema(surveys)
  .pick({
    title: true,
    fileReference: true,
    questionsCount: true,
    authorId: true,
    teamId: true,
    status: true,
  })
  .partial({
    teamId: true,
    status: true,
  })
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    status: surveyStatusSchema,
  });

export const updateSurveySchema = createInsertSchema(surveys)
  .pick({
    title: true,
    fileReference: true,
    questionsCount: true,
    teamId: true,
    status: true,
  })
  .partial()
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    status: surveyStatusSchema.optional(),
  });

// Survey-Teams schema
export const insertSurveyTeamSchema = createInsertSchema(surveyTeams).pick({
  surveyId: true,
  teamId: true,
});

// Assessment validation schemas
export const assessmentStatusSchema = z
  .enum(["draft", "in-progress", "completed"])
  .default("draft");

export const assessmentAnswerSchema = z.object({
  q: z.number(), // question id
  a: z
    .union([
      z.literal(-2),
      z.literal(-1),
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.null(),
    ])
    .optional(), // answer score
  r: z.string().optional(), // recommendation
});

export const insertAssessmentSchema = createInsertSchema(assessments)
  .pick({
    title: true,
    userId: true,
    surveyTemplateId: true,
    status: true,
  })
  .extend({
    status: assessmentStatusSchema,
    answers: z.array(assessmentAnswerSchema),
  });

export const updateAssessmentSchema = createInsertSchema(assessments)
  .pick({
    title: true,
    status: true,
    score: true,
  })
  .partial()
  .extend({
    status: assessmentStatusSchema.optional(),
    answers: z.array(assessmentAnswerSchema).optional(),
  });