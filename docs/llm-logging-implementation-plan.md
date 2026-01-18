# LLM Logging System Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive LLM (Large Language Model) logging system that tracks all AI interactions with full traceability, cost tracking, and analytics capabilities.

## Architecture Overview

- **Database**: PostgreSQL with Drizzle ORM
- **Backend**: Express.js with service-layer architecture
- **Frontend**: React with ShadCN components
- **Isolation**: User-based (with future organization ID support)

---

## 1. Database Schema

### Table: `llm_logs`

```typescript
export const llmLogs = pgTable("llm_logs", {
  // Primary Identifiers
  id: serial("id").primaryKey(),
  schemaVersion: integer("schema_version").notNull().default(1), // Schema version for migration compatibility
  
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
  request: jsonb("request").$type<{
    provider: 'openai' | 'anthropic' | 'local' | string;
    model: string;
    endpoint: 'chat.completions' | 'embeddings' | string;
    messages?: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
      content: string;
      redactionStatus?: 'raw' | 'redacted' | 'masked';
    }>;
    tools?: any[]; // or typed
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    metadata?: Record<string, any>; // featureName, route, AB-experiment, etc.
  }>().notNull(),
  
  // Request Parameters (denormalized for filtering)
  temperature: real("temperature"), // Denormalized from request.temperature (float: 0.0-2.0)
  maxTokens: integer("max_tokens"), // Denormalized from request.maxTokens
  
  // Response Data
  response: jsonb("response").$type<{
    status: 'success' | 'error';
    httpStatus?: number;
    completion?: {
      messages?: Array<{
        role: 'assistant' | 'tool' | 'function';
        content: string;
      }>;
      finishReason?: string;
    };
    error?: {
      type: string;
      message: string;
      code?: string;
      retryable?: boolean;
    };
  }>(),
  
  // Metrics
  metrics: jsonb("metrics").$type<{
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  }>(),
  
  // Execution Details
  retries: integer("retries").default(0),
  
  // Security & Redaction
  security: jsonb("security").$type<{
    redactionRules: Array<{
      type: string; // "email", "phone", "ssn", "credit_card", etc.
      applied: boolean;
      method: string; // "redaction" (always redaction)
    }>;
  }>(),
  redactionStatus: text("redaction_status").default("pending"), // "pending", "completed", "failed"
  
  // Observability & Tracing
  debug: jsonb("debug").$type<{
    requestId: string;
    internalId?: string;
    traceId?: string;
    [key: string]: any; // Ad-hoc debugging data
  }>(),
  stableTrace: jsonb("stable_trace").$type<{
    functionCalls?: Array<{
      name: string;
      arguments: any;
      result?: any;
    }>;
    ragHits?: Array<{
      source: string;
      score: number;
      content: string;
    }>;
    // Other structured trace data (tool calls, etc.)
  }>()
});
```

### Indexes

```typescript
// Performance indexes for filtering (ordered by query frequency)
// Composite indexes with DESC ordering for common query patterns

// User queries (most common)
- (userId, timestamp DESC) // For user's recent logs, ordered by time
- (userId, environment, timestamp DESC) // User logs by environment

// Provider/Model analytics
- (provider, model, timestamp DESC) // Provider/model analytics over time
- (provider, timestamp DESC) // Provider-level queries

// Environment & routing
- (environment, timestamp DESC) // Environment-specific queries
- (route, timestamp DESC) // Route-level analytics
- (featureName, timestamp DESC) // Feature-level analytics

// Single column indexes
- timestamp DESC // Time-based queries (most common filter)
- userId // User filtering
- provider // Provider filtering
- model // Model filtering
- environment // Environment filtering

// Denormalized fields
- temperature // Temperature filtering (if common)
- maxTokens // Max tokens filtering (if common)

// Soft delete support
- deletedAt // For filtering active vs deleted records
- (deletedAt IS NULL) WHERE deletedAt IS NULL // Partial index for active records only

// JSONB indexes for querying request/response objects
- GIN index on request // For efficient JSONB queries on request
- GIN index on response // For efficient JSONB queries on response
- GIN index on metrics // For efficient JSONB queries on metrics
- GIN index on (response->>'status') // For filtering by success/error status

// Error analysis
- (retries > 0) WHERE retries > 0 // Partial index for retry analysis
- (response->>'status' = 'error') WHERE response->>'status' = 'error' // Partial index for errors
```

**Index Usage Notes:**
- DESC ordering optimizes "recent first" queries (most common pattern)
- Composite indexes support multi-column filters efficiently
- Partial indexes reduce index size by only indexing relevant rows
- GIN indexes enable fast JSONB queries without full table scans

**Note**: PostgreSQL JSONB supports efficient querying:
```sql
-- Query by temperature (use denormalized field for better performance)
SELECT * FROM llm_logs WHERE temperature > 0.7;

-- Query by tools presence
SELECT * FROM llm_logs WHERE request ? 'tools';

-- Query by specific tool name
SELECT * FROM llm_logs WHERE request @> '{"tools": [{"type": "function"}]}';

-- Query active records only (soft delete support)
SELECT * FROM llm_logs WHERE deleted_at IS NULL;

-- Query with soft delete filter (uses composite index)
SELECT * FROM llm_logs 
WHERE deleted_at IS NULL -- Only active records
  AND user_id = 123 
  AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC; -- Uses composite index (userId, timestamp DESC)
```

---

## 2. PII Redaction Utility

### File: `server/utils/pii-redaction.ts`

**Purpose**: Automatically redact personal information before storing logs.

**Note**: Refactored from service to utility for better code organization (utilities are stateless transformation functions, not business services).

**Features**:
- Email detection and redaction
- Phone number detection and redaction
- SSN detection and redaction
- Credit card detection and redaction
- Custom patterns (configurable)
- Preserves structure while redacting PII

**Methods**:
```typescript
// Utility functions (not a class)
export function redactPII(content: string): RedactionResult {
  // Returns: { redacted, appliedRules, redactionStatus }
}

export function redactMessages(
  messages: Array<{ role: string; content: string }>
): {
  redacted: Array<{ role: string; content: string; redactionStatus?: "raw" | "redacted" | "masked" }>;
  redactionStatus: string;
  appliedRules: PIIRule[];
}
```

**Default Rules**:
- Email: Redact username (`user@domain.com` → `[REDACTED]@domain.com` or `***@domain.com`)
- Phone: Redact middle digits (`+1-555-123-4567` → `+1-555-XXX-4567`)
- SSN: Full redaction (`XXX-XX-XXXX`)
- Credit Card: Last 4 only (`****-****-****-1234`)
- Names: Redact with `[REDACTED]` or `***`

---

## 3. LLM Logging Service

### File: `server/services/llm-logging.service.ts`

**Purpose**: Centralized service for logging all LLM interactions.

**Methods**:
```typescript
class LLMLoggingService {
  // Log a complete LLM interaction
  static async logInteraction(params: {
    userId?: number;
    organizationId?: number;
    environment: string;
    route?: string;
    featureName: string;
    version?: string;
    provider: string;
    model: string;
    endpoint?: string;
    request: {
      provider: 'openai' | 'anthropic' | 'local' | string;
      model: string;
      endpoint: 'chat.completions' | 'embeddings' | string;
      messages?: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
        content: string;
        redactionStatus?: 'raw' | 'redacted' | 'masked';
      }>;
      tools?: any[]; // or typed
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      metadata?: Record<string, any>; // featureName, route, AB-experiment, etc.
    };
    response: {
      status: 'success' | 'error';
      httpStatus?: number;
      completion?: {
        messages?: Array<{
          role: 'assistant' | 'tool' | 'function';
          content: string;
        }>;
        finishReason?: string;
      };
      error?: {
        type: string;
        message: string;
        code?: string;
        retryable?: boolean;
      };
    };
    metrics: {
      latencyMs: number;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      estimatedCostUsd?: number;
    };
    retries?: number;
    stableTrace?: {
      functionCalls?: Array<{ name: string; arguments: any; result?: any }>;
      ragHits?: Array<{ source: string; score: number; content: string }>;
    };
    debug?: { requestId: string; [key: string]: any };
  }): Promise<number> // Returns log ID
  
  // Query logs with filters
  static async getLogs(filters: {
    userId?: number;
    organizationId?: number;
    startTime?: Date;
    endTime?: Date;
    route?: string;
    model?: string;
    provider?: string;
    minLatencyMs?: number;
    maxLatencyMs?: number;
    minTokens?: number;
    maxTokens?: number;
    includeDeleted?: boolean; // Include soft-deleted records (default: false)
    limit?: number;
    offset?: number;
  }): Promise<{ logs: LLMLog[]; total: number }>
  
  // Soft delete a log entry (for data retention policies)
  static async softDelete(logId: number): Promise<void>
  
  // Hard delete a log entry (permanent deletion, use with caution)
  static async hardDelete(logId: number): Promise<void>
  
  // Restore a soft-deleted log entry
  static async restore(logId: number): Promise<void>
  
  // Get analytics/aggregated metrics
  static async getAnalytics(filters: {
    userId?: number;
    organizationId?: number;
    startTime?: Date;
    endTime?: Date;
    groupBy?: "day" | "provider" | "model" | "route";
  }): Promise<AnalyticsResult>
}
```

---

## 4. Cost Estimation Utility

### File: `server/utils/cost-estimation.ts`

**Purpose**: Calculate estimated costs per provider/model.

**Pricing Data** (configurable):
```typescript
const PRICING = {
  openai: {
    "gpt-4.1": { prompt: 0.03, completion: 0.06 }, // per 1K tokens
    "gpt-4": { prompt: 0.03, completion: 0.06 },
    "gpt-3.5-turbo": { prompt: 0.0015, completion: 0.002 },
  },
  anthropic: {
    "claude-3-opus": { prompt: 0.015, completion: 0.075 },
    "claude-3-sonnet": { prompt: 0.003, completion: 0.015 },
  },
  // ... more providers
};

function estimateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Calculate cost in USD
}
```

---

## 5. Integration with AI Service

### Modify: `server/services/ai.service.ts`

**Changes**:
1. Wrap all OpenAI API calls with logging
2. Capture timing (start/end)
3. Capture request/response data
4. Apply PII redaction before logging
5. Calculate costs
6. Log function calls if any

**Example Integration**:
```typescript
static async generateSuggestions(assessment: any) {
  const startTime = Date.now();
  const requestId = req?.traceId || nanoid();
  
  try {
    // ... existing code ...
    
    // Prepare request object (before PII redaction for logging)
    const requestParams = {
      model: "gpt-4.1",
      messages: [...],
      temperature: 0.7,
      max_tokens: 16000,
    };
    
    const completion = await openai.chat.completions.create(requestParams);
    
    const latencyMs = Date.now() - startTime;
    const metrics = {
      latencyMs,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
      estimatedCostUsd: completion.usage?.prompt_tokens && completion.usage?.completion_tokens
        ? estimateCost("openai", "gpt-4.1", 
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens)
        : undefined,
    };
    
    // Apply PII redaction to request messages before logging
    const redactionResult = redactMessages(requestParams.messages);
    const redactedRequest = {
      provider: "openai" as const,
      model: "gpt-4.1",
      endpoint: "chat.completions" as const,
      messages: redactionResult.redacted.map((msg, idx) => ({
        ...msg,
        redactionStatus: redactionResult.appliedRules.some(rule => rule.applied) 
          ? 'redacted' as const 
          : 'raw' as const,
      })),
      temperature: 0.7,
      maxTokens: 16000,
      metadata: {
        featureName: "generate_suggestions",
        route: "/api/ai-suggestions",
        // AB-experiment, etc. can be added here
      },
    };
    
    // Log the interaction
    await LLMLoggingService.logInteraction({
      userId: req?.user?.id,
      environment: env.NODE_ENV,
      route: "/api/ai-suggestions",
      featureName: "generate_suggestions",
      provider: "openai",
      model: "gpt-4.1",
      endpoint: "chat.completions",
      request: redactedRequest, // Full request object with PII-redacted messages
      response: {
        status: 'success',
        httpStatus: 200,
        completion: {
          messages: completion.choices[0]?.message?.content
            ? [{
                role: (completion.choices[0].message.role as string) === 'tool' 
                  ? 'tool' 
                  : (completion.choices[0].message.role as string) === 'function'
                  ? 'function'
                  : 'assistant', // Default to 'assistant'
                content: completion.choices[0].message.content || "",
              }]
            : undefined,
          finishReason: completion.choices[0]?.finish_reason,
        },
      },
      metrics,
      debug: { requestId },
    });
    
    return result;
  } catch (error: any) {
    // Log error (redactedRequest may not exist if error occurred before request creation)
    const errorRequest = redactedRequest || {
      provider: "openai" as const,
      model: "gpt-4.1",
      endpoint: "chat.completions" as const,
      messages: requestParams?.messages?.map(msg => ({
        ...msg,
        redactionStatus: 'raw' as const,
      })) || [],
      metadata: {
        featureName: "generate_suggestions",
        route: "/api/ai-suggestions",
      },
    };
    
    await LLMLoggingService.logInteraction({
      userId: req?.user?.id,
      environment: env.NODE_ENV,
      route: "/api/ai-suggestions",
      featureName: "generate_suggestions",
      provider: "openai",
      model: "gpt-4.1",
      endpoint: "chat.completions",
      request: errorRequest,
      response: {
        status: 'error',
        httpStatus: error?.status || 500,
        error: {
          type: error?.name || 'UnknownError',
          message: error?.message || 'Failed to generate suggestions',
          code: error?.code,
          retryable: error?.retryable || false,
        },
      },
      metrics: {
        latencyMs: Date.now() - startTime,
      },
      debug: { requestId },
    });
    throw error;
  }
}
```

---

## 6. API Routes

### File: `server/routes.ts` (additions)

```typescript
// POST /api/logs/llm - Create a log entry (internal use, or for external integrations)
app.post(
  "/api/logs/llm",
  auth, // Optional: can be public for external integrations
  requestSizeLimiter,
  validateBody(llmLogSchema),
  LLMLogController.create
);

// GET /api/logs/llm - Query logs with filters
app.get(
  "/api/logs/llm",
  auth,
  requireAdmin, // Or user can see their own logs
  validateQuery(llmLogQuerySchema),
  LLMLogController.getLogs
);

// GET /api/logs/llm/analytics - Get aggregated analytics
app.get(
  "/api/logs/llm/analytics",
  auth,
  requireAdmin,
  validateQuery(llmAnalyticsQuerySchema),
  LLMLogController.getAnalytics
);

// GET /api/logs/llm/:id - Get specific log entry
app.get(
  "/api/logs/llm/:id",
  auth,
  requireAdmin, // Or user can see their own logs
  validateParams({ id: z.number() }),
  LLMLogController.getById
);
```

---

## 7. Controller

### File: `server/controllers/llm-log.controller.ts`

```typescript
export class LLMLogController {
  static async create(req: Request, res: Response) {
    // Create log entry (mainly for internal use)
  }
  
  static async getLogs(req: Request, res: Response) {
    // Get filtered logs with pagination
    const filters = {
      userId: req.user?.id, // Users can only see their own logs unless admin
      ...req.query,
    };
    const result = await LLMLoggingService.getLogs(filters);
    return ApiResponse.success(res, result);
  }
  
  static async getAnalytics(req: Request, res: Response) {
    // Get aggregated analytics
    const result = await LLMLoggingService.getAnalytics(req.query);
    return ApiResponse.success(res, result);
  }
  
  static async getById(req: Request, res: Response) {
    // Get specific log entry
  }
}
```

---

## 8. Validation Schemas

### File: `server/middleware/schemas.ts` (additions)

```typescript
export const llmLogSchema = z.object({
  // ... validation for log creation
});

export const llmLogQuerySchema = z.object({
  userId: z.number().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  route: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  minLatencyMs: z.number().optional(),
  maxLatencyMs: z.number().optional(),
  minTokens: z.number().optional(),
  maxTokens: z.number().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const llmAnalyticsQuerySchema = z.object({
  userId: z.number().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  groupBy: z.enum(["day", "provider", "model", "route"]).optional(),
});
```

---

## 9. Frontend Components (ShadCN)

### Components Needed:

1. **LLM Logs Table** (`client/src/components/admin/llm-logs-table.tsx`)
   - Data table with filtering
   - Columns: Call Timestamp, User, Route, Provider, Model, Tokens, Cost, Latency, Status
   - Filters: User, Time Range, Route, Model, Provider, Latency, Token Usage
   - Pagination

2. **LLM Log Detail View** (`client/src/components/admin/llm-log-detail.tsx`)
   - Full log details
   - Request/Response messages
   - Metrics visualization
   - Function calls (if any)
   - Debug info

3. **LLM Analytics Dashboard** (`client/src/components/admin/llm-analytics.tsx`)
   - Cost over time chart
   - Usage by provider/model
   - Token usage trends
   - Latency distribution
   - Top routes/features

4. **LLM Logs Page** (`client/src/pages/admin/llm-logs.tsx`)
   - Combines table + detail view
   - Routing integration

---

## 10. Implementation Steps

### Phase 1: Core Infrastructure
1. ✅ Create database schema (`llm_logs` table)
2. ✅ Create migration file
3. ✅ Create PII redaction utility (refactored from service to utility)
4. ✅ Create cost estimation utility
5. ✅ Create LLM logging service

### Phase 2: Integration
6. ✅ Integrate logging into `AIService.generateSuggestions`
7. ✅ Integrate logging into `AIService.analyzeIndustry`
8. ✅ Add logging to any other LLM calls

### Phase 3: API Layer
9. ✅ Create validation schemas
10. ✅ Create `LLMLogController`
11. ✅ Add routes to `server/routes.ts`
12. ✅ Add authorization (users see own logs, admins see all)

### Phase 4: Frontend
13. ✅ Create ShadCN data table component
14. ✅ Create log detail view component
15. ✅ Create analytics dashboard component
16. ✅ Create admin page with routing
17. ✅ Add filtering and pagination

### Phase 5: Testing & Polish
18. ✅ Test PII redaction
19. ✅ Test cost calculations
20. ✅ Test filtering and analytics
21. ✅ Performance testing (indexes)
22. ✅ Documentation

---

## 11. Future Enhancements

- **Organization ID Support**: Add `organizationId` filtering when multi-tenancy is implemented
- **RAG Integration**: Log RAG hits when RAG is implemented
- **Real-time Streaming**: Support for streaming responses
- **Alerting**: Cost thresholds, error rate alerts
- **Export**: CSV/JSON export of logs
- **Retention Policies**: Automatic cleanup of old logs
- **Advanced Analytics**: ML-based insights, anomaly detection

---

## 12. Security Considerations

1. **PII Redaction**: Always redact PII before storage (email, phone, SSN, credit cards, names)
2. **Access Control**: Users can only see their own logs (unless admin)
3. **Encryption**: Consider encrypting sensitive fields at rest
4. **Audit Trail**: Log who accessed which logs (future)
5. **Rate Limiting**: Apply rate limits to log query endpoints

---

## 13. Performance Considerations

1. **Indexes**: Create indexes on frequently queried fields
2. **Pagination**: Always paginate log queries
3. **Archival**: Consider archiving old logs to separate table/storage
4. **Async Logging**: Consider async logging to avoid blocking requests
5. **Caching**: Cache analytics results for frequently accessed time ranges

---

## Notes

- All timestamps should use timezone-aware timestamps
- Cost estimation should be configurable (pricing can change)
- PII redaction rules should be configurable per environment
- Consider making logging optional/configurable per environment (dev vs prod)

