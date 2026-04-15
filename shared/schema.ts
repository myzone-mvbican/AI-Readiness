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
  real,
  varchar,
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
  orgId: integer("org_id"), // FK to organisations — nullable for backward compat
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

// Assessment schema (L1 org-level assessments)
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id),  // Removed .notNull() to support guest assessments
  orgId: integer("org_id"), // FK to organisations — nullable for backward compat
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

// LLM Logs schema
export const llmLogs = pgTable("llm_logs", {
  id: serial("id").primaryKey(),
  schemaVersion: integer("schema_version").notNull().default(1),
  
  // Ownership & Isolation
  userId: integer("user_id").references(() => users.id), // Nullable for guest users
  organizationId: integer("organization_id"), // Future: nullable for now
  
  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(), // When the LLM call occurred
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // When the log record was created
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // When the log record was last updated
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // NULL = active, timestamp = soft deleted
  
  // Request Metadata (denormalized for filtering)
  environment: text("environment").notNull(), // e.g., "development", "production"
  route: text("route"), // API route that triggered the LLM call
  featureName: text("feature_name"), // e.g., "generate_suggestions", "analyze_industry"
  
  // Provider & Model (denormalized for filtering)
  provider: text("provider").notNull(), // "openai", "anthropic", "llama", etc.
  model: text("model").notNull(), // "gpt-4.1", "claude-3-opus", "llama-3.5", etc.
  endpoint: text("endpoint"), // API endpoint type: "chat.completions", "embeddings", etc.
  
  // Request Data (full request preserved as JSONB)
  request: jsonb("request").notNull(),
  
  // Request Parameters (denormalized for filtering)
  temperature: real("temperature"), // Denormalized from request.temperature (float: 0.0-2.0)
  maxTokens: integer("max_tokens"), // Denormalized from request.maxTokens
  
  // Response Data
  response: jsonb("response"),
  
  // Metrics
  metrics: jsonb("metrics"),
  
  // Execution Details
  retries: integer("retries").default(0),
  
  // Security & Redaction
  security: jsonb("security"),
  redactionStatus: text("redaction_status").default("pending"), // "pending", "completed", "failed"
  
  // Observability & Tracing
  debug: jsonb("debug"),
  stableTrace: jsonb("stable_trace"),
});

// LLM Providers schema
export const llmProviders = pgTable(
  "llm_providers",
  {
    id: serial("id").primaryKey(),
    
    // Provider Information
    name: text("name").notNull().unique(), // "openai", "anthropic", "google"
    displayName: text("display_name").notNull(), // "OpenAI", "Anthropic", "Google AI"
    description: text("description"), // Optional description
    
    // API Configuration
    apiKeyEncrypted: text("api_key_encrypted"), // AES-256-GCM encrypted API key
    apiBaseUrl: text("api_base_url"), // Custom API base URL (for self-hosted or proxy)
    
    // Provider Capabilities
    availableModels: jsonb("available_models").notNull(), // ["gpt-4", "gpt-3.5-turbo", ...]
    defaultModel: text("default_model"), // Default model for this provider
    
    // Status
    isActive: boolean("is_active").default(true), // Enable/disable provider
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      nameIdx: uniqueIndex("llm_providers_name_idx").on(table.name),
      activeIdx: uniqueIndex("llm_providers_active_idx").on(table.isActive),
    };
  }
);

// LLM Settings schema
export const llmSettings = pgTable(
  "llm_settings",
  {
    // Primary Identifiers
    id: serial("id").primaryKey(),
    
    // Scope & Isolation
    organizationId: integer("organization_id"), // NULL = global settings (always NULL in MVP)
    providerId: integer("provider_id")
      .references(() => llmProviders.id, { onDelete: "cascade" })
      .notNull(),
    
    // Model Configuration
    preferredModel: text("preferred_model"), // Override provider's default model
    
    // LLM Parameters
    temperature: real("temperature").default(0.7), // 0.0-2.0
    maxTokens: integer("max_tokens").default(2000), // Max tokens per request
    topP: real("top_p").default(1.0), // 0.0-1.0
    frequencyPenalty: real("frequency_penalty").default(0), // -2.0 to 2.0
    presencePenalty: real("presence_penalty").default(0), // -2.0 to 2.0
    
    // Retry Configuration
    maxRetries: integer("max_retries").default(3),
    retryBackoffMs: integer("retry_backoff_ms").default(1000), // Exponential backoff base
    
    // Timeout Configuration
    requestTimeoutMs: integer("request_timeout_ms").default(60000), // 60 seconds
    
    // Logging Configuration
    enableLogging: boolean("enable_logging").default(true),
    logLevel: text("log_level").default("full"), // "full", "minimal", "errors_only"
    logRequestData: boolean("log_request_data").default(true),
    logResponseData: boolean("log_response_data").default(true),
    
    // Future Extension Fields (JSONB for flexibility)
    customSettings: jsonb("custom_settings"), // For future feature-specific settings
    
    // Status
    isActive: boolean("is_active").default(true),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      // Unique constraint: one active setting per provider (organizationId is NULL in MVP)
      orgProviderIdx: uniqueIndex("llm_settings_org_provider_idx").on(
        table.organizationId,
        table.providerId
      ),
      orgIdx: uniqueIndex("llm_settings_org_idx").on(table.organizationId),
      providerIdx: uniqueIndex("llm_settings_provider_idx").on(table.providerId),
      activeIdx: uniqueIndex("llm_settings_active_idx").on(table.isActive),
    };
  }
);

// Feature LLM Overrides schema
// Allows feature-specific and route-specific overrides of LLM settings
export const featureLlmOverrides = pgTable(
  "feature_llm_overrides",
  {
    // Primary Identifiers
    id: serial("id").primaryKey(),
    
    // Feature & Route Identification
    featureName: text("feature_name").notNull(), // e.g., "generate_suggestions", "analyze_industry"
    route: text("route"), // API route (nullable = applies to all routes for this feature)
    
    // Provider Reference
    providerId: integer("provider_id")
      .references(() => llmProviders.id, { onDelete: "cascade" })
      .notNull(),
    
    // Model Configuration
    preferredModel: text("preferred_model"), // Override provider's default model
    
    // LLM Parameters (all nullable - only override what's specified)
    temperature: real("temperature"), // 0.0-2.0
    maxTokens: integer("max_tokens"), // Max tokens per request
    topP: real("top_p"), // 0.0-1.0
    frequencyPenalty: real("frequency_penalty"), // -2.0 to 2.0
    presencePenalty: real("presence_penalty"), // -2.0 to 2.0
    
    // Retry Configuration
    maxRetries: integer("max_retries"),
    retryBackoffMs: integer("retry_backoff_ms"), // Exponential backoff base in milliseconds
    
    // Timeout Configuration
    requestTimeoutMs: integer("request_timeout_ms"), // Request timeout in milliseconds
    
    // Status
    isActive: boolean("is_active").default(true),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      // Unique constraint: one override per feature/route/provider combination
      // NULL route means "all routes for this feature"
      featureRouteProviderIdx: uniqueIndex("feature_llm_overrides_feature_route_provider_idx").on(
        table.featureName,
        table.route,
        table.providerId
      ),
      // Index for quick lookup by feature
      featureIdx: uniqueIndex("feature_llm_overrides_feature_idx").on(table.featureName),
      // Index for provider lookups
      providerIdx: uniqueIndex("feature_llm_overrides_provider_idx").on(table.providerId),
    };
  }
);

// ═══════════════════════════════════════════════════════════
// Organisation & Delegation Tables (Readiness Platform v3)
// ═══════════════════════════════════════════════════════════

// Organisations — multi-tenancy foundation
export const organisations = pgTable("organisations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  naicsCode: text("naics_code"),
  naicsLabel: text("naics_label"),
  employeeCount: text("employee_count"), // "1-9", "10-49", "50-99", "100-249", "250+"
  country: text("country").default("US"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Org members — links users to organisations with roles
export const orgMembers = pgTable(
  "org_members",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    // Roles: "owner" (CEO/admin who created org), "admin", "dept_head", "member"
    department: text("department"), // For dept_head + member assignment
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orgUserUnique: unique("org_members_org_user_unq").on(table.orgId, table.userId),
  })
);

// Org departments — configurable per organisation
export const orgDepartments = pgTable(
  "org_departments",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),           // Display name: "Marketing"
    slug: text("slug").notNull(),           // URL-safe: "marketing"
    headUserId: integer("head_user_id").references(() => users.id),
    headName: text("head_name"),            // Name before they register
    headEmail: text("head_email"),          // Email for invitation
    l2Status: text("l2_status").default("not_started"),
    // not_started | invited | in_progress | completed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgSlugUnique: unique("org_departments_org_slug_unq").on(table.orgId, table.slug),
  })
);

// Invitations — for dept heads and team members
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull(),             // "dept_head" | "member"
  department: text("department"),            // For dept_head invites
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: text("status").default("pending"), // pending | accepted | expired
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════
// L2 & L3 Assessment Tables
// ═══════════════════════════════════════════════════════════

// L2 Department Assessments — server-persisted
export const l2Assessments = pgTable("l2_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").references(() => organisations.id),
  departmentId: integer("department_id").references(() => orgDepartments.id),
  department: text("department").notNull(), // Slug: "marketing"
  responses: jsonb("responses").notNull(),  // Raw answer data
  overallScore: real("overall_score"),
  maturityStage: text("maturity_stage"),    // Crawl | Walk | Run | Fly
  categoryScores: jsonb("category_scores"), // [{category, score, band}]
  topGaps: jsonb("top_gaps"),
  topStrengths: jsonb("top_strengths"),
  status: text("status").default("completed"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// L3 Personal Assessments — server-persisted
export const l3Assessments = pgTable("l3_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").references(() => organisations.id),
  name: text("name"),
  department: text("department"),
  roleLevel: text("role_level"),
  industry: text("industry"),
  conversationHistory: jsonb("conversation_history"),
  dimensionScores: jsonb("dimension_scores"), // [{dimension, score, band, strengths, areas}]
  overallScore: real("overall_score"),
  maturityStage: text("maturity_stage"),
  topStrengths: jsonb("top_strengths"),
  topAreasForDevelopment: jsonb("top_areas_for_development"),
  status: text("status").default("completed"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════
// AI Rocks & Health Scores
// ═══════════════════════════════════════════════════════════

// AI Rocks — cross-layer action items
export const aiRocks = pgTable("ai_rocks", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organisations.id),
  userId: integer("user_id").references(() => users.id),
  sourceLayer: text("source_layer").notNull(), // L1 | L2 | L3
  sourceAssessmentId: integer("source_assessment_id"),
  sourcePillar: text("source_pillar"),
  title: text("title").notNull(),
  rationale: text("rationale"),
  expectedImpact: text("expected_impact"),     // High | Medium | Low
  effortBand: text("effort_band"),             // S | M | L
  acceptanceCriteria: text("acceptance_criteria"),
  status: text("status").default("active"),    // active | completed | archived
  completedAt: timestamp("completed_at", { withTimezone: true }),
  quarter: text("quarter"),                    // "2026-Q2"
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Health Scores — cached master score per organisation
export const healthScores = pgTable("health_scores", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organisations.id).unique(),
  l1Score: real("l1_score"),
  l2AvgScore: real("l2_avg_score"),
  l3AvgScore: real("l3_avg_score"),
  masterScore: real("master_score"),           // Equal-weighted average of active layers
  activeLayers: integer("active_layers"),      // How many layers have data (1-3)
  industryGrade: text("industry_grade"),       // A through F
  industryPercentile: integer("industry_percentile"),
  trend: text("trend"),                        // up | down | flat
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
});