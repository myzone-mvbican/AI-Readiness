# OpenRouter-like API Implementation Plan

**Project:** MyZone AI Readiness  
**Date:** January 2025  
**Goal:** Design and implement a unified API similar to OpenRouter for backend AI features, with comprehensive logging and LLM settings management  
**Status:** 📋 **PLANNING**

---

## Overview

This document outlines the plan to create a unified API interface similar to OpenRouter that provides:
1. **Unified AI Endpoints** - Single API interface for all AI operations
2. **Comprehensive Logging API** - Query and analyze LLM interaction logs
3. **LLM Settings Management API** - Configure and manage AI provider settings
4. **Analytics & Monitoring** - Usage statistics, cost tracking, and performance metrics
5. **Developer-Friendly** - Well-documented, consistent, and easy to integrate

### Key Principles (Inspired by OpenRouter)

- **Unified Interface**: Single API endpoint for multiple AI providers/models
- **Transparent Logging**: Comprehensive logging with privacy controls
- **Flexible Configuration**: Dynamic LLM settings management
- **Cost Tracking**: Built-in cost estimation and budget management
- **Developer Experience**: Clear documentation, SDK support, and examples

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    External API Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   AI API     │  │  Logs API    │  │ Settings API │    │
│  │  Endpoints   │  │  Endpoints   │  │  Endpoints   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Authentication & Authorization                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  API Keys    │  │ Rate Limits  │  │   Permissions│    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  AIService   │  │ LLMLogService│  │LLMSettings   │    │
│  │              │  │              │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  llm_logs    │  │llm_settings  │  │ llm_providers│    │
│  │    table     │  │    table     │  │    table     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Unified AI API Endpoints

### 1.1 Chat Completions Endpoint

**Endpoint:** `POST /api/v1/chat/completions`

**Purpose:** Unified endpoint for chat completion requests across all providers/models

**Request Format:**
```typescript
{
  model: string;                    // e.g., "openai/gpt-4o", "anthropic/claude-3-opus"
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;              // 0.0-2.0 (from settings if not provided)
  max_tokens?: number;               // (from settings if not provided)
  top_p?: number;                    // (from settings if not provided)
  frequency_penalty?: number;        // (from settings if not provided)
  presence_penalty?: number;         // (from settings if not provided)
  stream?: boolean;                  // Enable streaming responses
  metadata?: {                        // Optional metadata for logging
    feature_name?: string;
    route?: string;
    user_id?: number;
    organization_id?: number;
  };
}
```

**Response Format:**
```typescript
{
  id: string;                        // Request ID
  model: string;                     // Model used
  created: number;                   // Unix timestamp
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    estimated_usd: number;
    currency: "USD";
  };
  latency_ms: number;
}
```

**Features:**
- Automatic provider/model routing based on model string
- Settings resolution (temperature, tokens, etc.)
- Automatic logging via LLMLogService
- Cost estimation
- Error handling with retries
- Streaming support (optional)

**Implementation Steps:**
1. Create `server/controllers/api-v1/chat.controller.ts`
2. Create `server/services/api-v1/chat.service.ts`
3. Add route in `server/routes.ts`
4. Integrate with existing AIService for provider abstraction
5. Add validation schemas

---

### 1.2 Feature-Specific Endpoints

**Endpoint:** `POST /api/v1/features/:featureName`

**Purpose:** Wrapper endpoints for existing features (analyze-industry, generate-suggestions)

**Examples:**
- `POST /api/v1/features/analyze-industry`
- `POST /api/v1/features/generate-suggestions`

**Request Format:**
```typescript
{
  // Feature-specific parameters
  [key: string]: any;
  
  // Optional overrides
  model?: string;
  temperature?: number;
  max_tokens?: number;
  
  // Metadata
  metadata?: {
    user_id?: number;
    organization_id?: number;
  };
}
```

**Response Format:**
```typescript
{
  id: string;
  feature: string;
  result: any;                       // Feature-specific result
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    estimated_usd: number;
  };
  latency_ms: number;
}
```

**Implementation Steps:**
1. Create `server/controllers/api-v1/features.controller.ts`
2. Map existing AIService methods to unified API
3. Add route registration
4. Add validation schemas per feature

---

## Phase 2: Logging API Endpoints

### 2.1 List Logs

**Endpoint:** `GET /api/v1/logs`

**Purpose:** Query and retrieve LLM interaction logs with filtering and pagination

**Query Parameters:**
```typescript
{
  // Pagination
  page?: number;                     // Default: 1
  limit?: number;                    // Default: 50, Max: 500
  
  // Filtering
  user_id?: number;
  organization_id?: number;
  provider?: string;                 // e.g., "openai", "anthropic"
  model?: string;                    // e.g., "gpt-4o", "claude-3-opus"
  feature_name?: string;             // e.g., "analyze_industry"
  route?: string;                    // e.g., "/api/analyze-industry"
  environment?: string;              // e.g., "production", "development"
  
  // Date Range
  start_date?: string;               // ISO 8601 format
  end_date?: string;                 // ISO 8601 format
  
  // Status Filtering
  status?: "success" | "error";     // Filter by response status
  
  // Sorting
  sort_by?: "timestamp" | "cost" | "latency_ms" | "total_tokens";
  sort_order?: "asc" | "desc";      // Default: "desc"
  
  // Cost Filtering
  min_cost?: number;                 // Minimum cost in USD
  max_cost?: number;                 // Maximum cost in USD
}
```

**Response Format:**
```typescript
{
  data: Array<{
    id: number;
    timestamp: string;               // ISO 8601
    user_id?: number;
    organization_id?: number;
    provider: string;
    model: string;
    endpoint: string;
    feature_name?: string;
    route?: string;
    environment: string;
    
    // Request summary (redacted if PII detected)
    request_summary: {
      message_count: number;
      temperature?: number;
      max_tokens?: number;
    };
    
    // Response summary
    response_summary: {
      status: "success" | "error";
      http_status: number;
      finish_reason?: string;
      error?: {
        type: string;
        message: string;
      };
    };
    
    // Metrics
    metrics: {
      latency_ms: number;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      estimated_cost_usd?: number;
    };
    
    // Security
    redaction_status: "pending" | "completed" | "failed";
    security?: {
      redaction_rules?: string[];
    };
    
    // Debug
    debug?: {
      request_id: string;
    };
  }>;
  
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  
  summary: {
    total_requests: number;
    total_cost_usd: number;
    total_tokens: number;
    average_latency_ms: number;
  };
}
```

**Implementation Steps:**
1. Extend `server/controllers/llm-log.controller.ts` with new endpoints
2. Add query parameter validation schemas
3. Enhance `LLMLogRepository` with advanced filtering
4. Add aggregation queries for summary statistics
5. Add response formatting utilities

---

### 2.2 Get Log Details

**Endpoint:** `GET /api/v1/logs/:id`

**Purpose:** Retrieve detailed information about a specific log entry

**Response Format:**
```typescript
{
  id: number;
  timestamp: string;
  user_id?: number;
  organization_id?: number;
  provider: string;
  model: string;
  endpoint: string;
  feature_name?: string;
  route?: string;
  environment: string;
  
  // Full request (may be redacted)
  request: {
    provider: string;
    model: string;
    endpoint: string;
    messages: Array<{
      role: string;
      content: string;               // May be truncated/redacted
    }>;
    temperature?: number;
    max_tokens?: number;
    metadata?: any;
  };
  
  // Full response
  response: {
    status: "success" | "error";
    http_status: number;
    completion?: {
      messages: Array<{
        role: string;
        content: string;             // May be truncated
      }>;
      finish_reason?: string;
    };
    error?: {
      type: string;
      message: string;
      code?: string;
      retryable: boolean;
    };
  };
  
  // Full metrics
  metrics: {
    latency_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd?: number;
  };
  
  retries: number;
  security: {
    redaction_rules?: string[];
  };
  redaction_status: "pending" | "completed" | "failed";
  debug?: {
    request_id: string;
  };
}
```

**Implementation Steps:**
1. Add method to `LLMLogController`
2. Add route registration
3. Add access control (users can only see their own logs, admins see all)

---

### 2.3 Log Analytics

**Endpoint:** `GET /api/v1/logs/analytics`

**Purpose:** Aggregate statistics and analytics about LLM usage

**Query Parameters:**
```typescript
{
  // Time Range (required)
  start_date: string;                // ISO 8601 format
  end_date: string;                  // ISO 8601 format
  
  // Grouping
  group_by?: "day" | "week" | "month" | "provider" | "model" | "feature";
  
  // Filtering (same as list logs)
  user_id?: number;
  organization_id?: number;
  provider?: string;
  model?: string;
  feature_name?: string;
}
```

**Response Format:**
```typescript
{
  period: {
    start: string;
    end: string;
  };
  
  totals: {
    requests: number;
    successful_requests: number;
    failed_requests: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_cost_usd: number;
    average_latency_ms: number;
  };
  
  // Grouped data (if group_by specified)
  groups?: Array<{
    key: string;                     // e.g., "2025-01-15" or "openai"
    requests: number;
    total_cost_usd: number;
    total_tokens: number;
    average_latency_ms: number;
  }>;
  
  // Breakdown by provider
  by_provider: Array<{
    provider: string;
    requests: number;
    total_cost_usd: number;
    total_tokens: number;
  }>;
  
  // Breakdown by model
  by_model: Array<{
    provider: string;
    model: string;
    requests: number;
    total_cost_usd: number;
    total_tokens: number;
  }>;
  
  // Breakdown by feature
  by_feature: Array<{
    feature_name: string;
    requests: number;
    total_cost_usd: number;
    average_latency_ms: number;
  }>;
  
  // Cost trends (if group_by is time-based)
  cost_trend?: Array<{
    date: string;
    cost_usd: number;
  }>;
}
```

**Implementation Steps:**
1. Create `server/services/llm-analytics.service.ts`
2. Add aggregation queries to repository
3. Add controller endpoint
4. Add route registration
5. Add caching for expensive queries

---

### 2.4 Export Logs

**Endpoint:** `GET /api/v1/logs/export`

**Purpose:** Export logs in various formats (JSON, CSV)

**Query Parameters:**
```typescript
{
  format?: "json" | "csv";          // Default: "json"
  
  // Same filtering as list logs
  start_date?: string;
  end_date?: string;
  provider?: string;
  model?: string;
  feature_name?: string;
  // ... other filters
}
```

**Response:**
- Content-Type: `application/json` or `text/csv`
- Content-Disposition: `attachment; filename="llm-logs-{timestamp}.{ext}"`

**Implementation Steps:**
1. Create export utility service
2. Add controller endpoint
3. Add streaming response for large exports
4. Add rate limiting for export endpoints

---

## Phase 3: LLM Settings Management API

### 3.1 Provider Management

**Endpoints:**
- `GET /api/v1/settings/providers` - List all providers
- `GET /api/v1/settings/providers/:id` - Get provider details
- `POST /api/v1/settings/providers` - Create provider (admin only)
- `PUT /api/v1/settings/providers/:id` - Update provider (admin only)
- `DELETE /api/v1/settings/providers/:id` - Delete provider (admin only)
- `POST /api/v1/settings/providers/:id/api-key` - Set API key (admin only)

**Note:** These endpoints already exist but may need to be moved/renamed to `/api/v1/settings/` prefix for consistency.

---

### 3.2 Settings Management

**Endpoints:**
- `GET /api/v1/settings/effective` - Get effective settings for current context
- `GET /api/v1/settings/global` - Get global settings (admin only)
- `POST /api/v1/settings/global` - Create/update global settings (admin only)
- `GET /api/v1/settings/organization/:orgId` - Get org settings (admin only, Phase 2)
- `POST /api/v1/settings/organization/:orgId` - Create/update org settings (admin only, Phase 2)
- `GET /api/v1/settings/feature/:featureName` - Get feature-specific settings (Phase 2)
- `POST /api/v1/settings/feature/:featureName` - Create/update feature settings (admin only, Phase 2)

**Note:** Some endpoints already exist but may need to be moved/renamed to `/api/v1/settings/` prefix.

---

### 3.3 Settings Validation

**Endpoint:** `POST /api/v1/settings/validate`

**Purpose:** Validate settings configuration before applying

**Request Format:**
```typescript
{
  provider_id: number;
  settings: {
    temperature?: number;
    max_tokens?: number;
    // ... other settings
  };
}
```

**Response Format:**
```typescript
{
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}
```

---

## Phase 4: Authentication & Authorization

### 4.1 API Key Authentication

**Purpose:** Allow external clients to authenticate using API keys

**Implementation:**
1. Create `api_keys` table:
   ```sql
   CREATE TABLE api_keys (
     id SERIAL PRIMARY KEY,
     key_hash TEXT NOT NULL UNIQUE,      -- Hashed API key
     name TEXT NOT NULL,                  -- Human-readable name
     user_id INTEGER REFERENCES users(id),
     organization_id INTEGER REFERENCES organizations(id),
     permissions JSONB,                   -- e.g., ["logs:read", "settings:read"]
     rate_limit_per_minute INTEGER DEFAULT 60,
     rate_limit_per_hour INTEGER DEFAULT 1000,
     expires_at TIMESTAMP,
     last_used_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     deleted_at TIMESTAMP
   );
   ```

2. Create `server/middleware/api-key-auth.ts`:
   - Extract API key from `Authorization: Bearer <key>` header
   - Validate key hash
   - Attach user/org context to request
   - Check permissions
   - Update last_used_at

3. Create `server/services/api-key.service.ts`:
   - Generate API keys
   - Hash keys (bcrypt)
   - Validate keys
   - Manage permissions

4. Add API key management endpoints:
   - `POST /api/v1/auth/api-keys` - Create API key
   - `GET /api/v1/auth/api-keys` - List user's API keys
   - `DELETE /api/v1/auth/api-keys/:id` - Revoke API key

---

### 4.2 Rate Limiting

**Purpose:** Prevent abuse and ensure fair usage

**Implementation:**
1. Use existing rate limiting middleware
2. Add per-API-key rate limits
3. Add per-user rate limits
4. Add per-organization rate limits
5. Return rate limit headers:
   ```
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 45
   X-RateLimit-Reset: 1640995200
   ```

---

### 4.3 Permissions System

**Purpose:** Fine-grained access control

**Permission Structure:**
```typescript
{
  "logs": {
    "read": boolean,
    "read:own": boolean,              // Only own logs
    "read:organization": boolean,     // Organization logs
    "read:all": boolean,              // All logs (admin)
    "export": boolean
  },
  "settings": {
    "read": boolean,
    "write": boolean,                 // Admin only
    "write:api-keys": boolean         // Admin only
  },
  "ai": {
    "chat": boolean,
    "features": string[]              // Allowed feature names
  }
}
```

---

## Phase 5: Analytics & Monitoring

### 5.1 Usage Dashboard Endpoint

**Endpoint:** `GET /api/v1/analytics/dashboard`

**Purpose:** Get overview statistics for dashboard

**Response Format:**
```typescript
{
  period: {
    start: string;
    end: string;
  };
  
  overview: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    total_cost_usd: number;
    total_tokens: number;
    average_latency_ms: number;
  };
  
  recent_activity: Array<{
    timestamp: string;
    feature: string;
    status: "success" | "error";
    cost_usd: number;
  }>;
  
  top_models: Array<{
    provider: string;
    model: string;
    requests: number;
    cost_usd: number;
  }>;
  
  cost_trend: Array<{
    date: string;
    cost_usd: number;
  }>;
}
```

---

### 5.2 Health Check Endpoint

**Endpoint:** `GET /api/v1/health`

**Purpose:** API health and status information

**Response Format:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    database: "healthy" | "unhealthy";
    llm_providers: Array<{
      provider: string;
      status: "available" | "unavailable";
      last_check: string;
    }>;
  };
}
```

---

## Phase 6: Developer Experience

### 6.1 API Documentation

**Implementation:**
1. Use OpenAPI/Swagger specification
2. Generate interactive docs (Swagger UI or ReDoc)
3. Add endpoint: `GET /api/v1/docs`
4. Include request/response examples
5. Include authentication examples

---

### 6.2 SDK Support

**Purpose:** Provide SDKs for popular languages

**Priority Languages:**
1. TypeScript/JavaScript (Node.js)
2. Python
3. cURL examples

**SDK Features:**
- Type-safe client
- Automatic retries
- Error handling
- Streaming support
- TypeScript types

---

### 6.3 Webhooks

**Endpoint:** `POST /api/v1/webhooks`

**Purpose:** Allow users to register webhooks for events

**Events:**
- `log.created` - New log entry created
- `cost.threshold` - Cost threshold reached
- `error.rate_limit` - Rate limit exceeded
- `settings.updated` - Settings changed

**Implementation:**
1. Create `webhooks` table
2. Create webhook service
3. Add webhook delivery mechanism
4. Add retry logic for failed deliveries

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Database schema review (already exists)
- ✅ Authentication system (API keys)
- ✅ Basic rate limiting
- ✅ Unified chat completions endpoint
- ✅ Basic logging API endpoints

### Phase 2: Core Features (Weeks 3-4)
- ✅ Advanced logging API (analytics, export)
- ✅ Settings management API (unified endpoints)
- ✅ Feature-specific endpoints
- ✅ Error handling and retries

### Phase 3: Analytics & Monitoring (Week 5)
- ✅ Analytics endpoints
- ✅ Dashboard endpoint
- ✅ Health check endpoint
- ✅ Cost tracking enhancements

### Phase 4: Developer Experience (Week 6)
- ✅ API documentation (OpenAPI)
- ✅ TypeScript SDK
- ✅ Python SDK (basic)
- ✅ Webhooks (optional)

### Phase 5: Testing & Polish (Week 7)
- ✅ Integration tests
- ✅ Performance testing
- ✅ Security audit
- ✅ Documentation review

---

## Database Schema Additions

### API Keys Table

```typescript
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  permissions: jsonb("permissions"),
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});
```

### Webhooks Table (Optional)

```typescript
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  url: text("url").notNull(),
  events: jsonb("events").notNull(), // Array of event names
  secret: text("secret").notNull(),  // For webhook signature
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

## Security Considerations

1. **API Key Security**
   - Store hashed keys (never plaintext)
   - Use secure random generation
   - Implement key rotation
   - Monitor for suspicious activity

2. **Rate Limiting**
   - Per-API-key limits
   - Per-user limits
   - Per-organization limits
   - IP-based rate limiting (optional)

3. **Data Privacy**
   - Respect PII redaction settings
   - Implement data retention policies
   - Allow users to delete their logs
   - Comply with GDPR/CCPA

4. **Access Control**
   - Fine-grained permissions
   - Organization isolation
   - Audit logging for admin actions

---

## API Versioning Strategy

- Use URL versioning: `/api/v1/`
- Maintain backward compatibility within major versions
- Deprecation notices in headers: `X-API-Deprecated: true`
- Migration guide for breaking changes

---

## Error Handling

**Standard Error Response:**
```typescript
{
  error: {
    code: string;                    // e.g., "INVALID_REQUEST", "RATE_LIMIT_EXCEEDED"
    message: string;
    details?: any;
    request_id: string;
  }
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Bad request format
- `UNAUTHORIZED` - Missing/invalid API key
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `PROVIDER_ERROR` - LLM provider error
- `INTERNAL_ERROR` - Server error

---

## Performance Considerations

1. **Caching**
   - Cache settings lookups
   - Cache analytics aggregations
   - Use Redis for rate limiting

2. **Database Optimization**
   - Indexes on frequently queried fields
   - Partitioning for large log tables (future)
   - Connection pooling

3. **Response Optimization**
   - Pagination for large result sets
   - Field selection (optional)
   - Compression for large responses

---

## Testing Strategy

1. **Unit Tests**
   - Service layer logic
   - Validation schemas
   - Utility functions

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Authentication flows

3. **E2E Tests**
   - Complete request flows
   - Error scenarios
   - Rate limiting

4. **Load Tests**
   - Concurrent request handling
   - Database query performance
   - Rate limiting effectiveness

---

## Documentation Requirements

1. **API Reference**
   - All endpoints documented
   - Request/response examples
   - Error codes and handling

2. **Getting Started Guide**
   - Authentication setup
   - First API call
   - Common use cases

3. **SDK Documentation**
   - Installation
   - Basic usage
   - Advanced features

4. **Migration Guides**
   - From existing endpoints to v1 API
   - Version upgrade guides

---

## Success Metrics

1. **Adoption**
   - Number of API keys created
   - API request volume
   - Active users

2. **Performance**
   - Average response time
   - Error rate
   - Uptime

3. **Developer Experience**
   - Time to first API call
   - Documentation page views
   - Support tickets

---

## Next Steps

1. **Review & Approval**
   - Review this plan with team
   - Get stakeholder approval
   - Prioritize features

2. **Start Implementation**
   - Begin with Phase 1 (Foundation)
   - Set up project structure
   - Create initial endpoints

3. **Iterate**
   - Gather feedback
   - Adjust plan as needed
   - Continue with subsequent phases

---

## References

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- Existing LLM Logging Implementation
- Existing LLM Settings Implementation
- Current AI Service Implementation

---

**Last Updated:** January 2025  
**Status:** 📋 **PLANNING** - Ready for review and implementation

