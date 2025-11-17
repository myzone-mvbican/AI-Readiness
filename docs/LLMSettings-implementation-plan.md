# LLM Settings Implementation Plan (MVP)

**Project:** MyZone AI Readiness  
**Date:** January 2025  
**Goal:** Implement foundational LLM settings management system for configuring AI providers, models, and defaults  
**Status:** 📋 **PLANNING - MVP PHASE**

---

## Overview

This document outlines the **MVP implementation plan** for an LLM Settings system that allows administrators to configure AI provider settings, model defaults, API keys, and operational parameters. The system follows a pragmatic two-table design that can be extended in future phases.

### MVP Features (Phase 1)
- ✅ **Provider Management** - Configure multiple AI providers (OpenAI, Anthropic, etc.)
- ✅ **Model Configuration** - Set default models per provider
- ✅ **API Key Management** - Secure, encrypted storage of API keys
- ✅ **Default Parameters** - Configure temperature, max tokens, and other defaults
- ✅ **Logging Preferences** - Control logging behavior
- ✅ **Retry & Timeout Configuration** - Configure retry and timeout behavior

**Note:** Organization-level settings are **NOT** implemented in MVP. The `organizationId` field exists in the schema but is always `NULL` in MVP. Organization-specific configuration is deferred to a future phase.

### Future Enhancements (Deferred)
- 🔜 **Organization Settings** - Organization-level configuration overrides (Phase 2)
- 🔜 **Feature Overrides** - Per-feature configuration overrides (Phase 2)
- 🔜 **Cost Management** - Budgets and cost limits (Phase 2)
- 🔜 **Advanced Rate Limiting** - Per-provider/feature rate limits (Phase 2)
- 🔜 **PII Redaction Settings** - Advanced PII configuration (Phase 2)
- 🔜 **Audit Logging** - Settings change history (Phase 3)

---

## Architecture Overview

- **Database**: PostgreSQL with Drizzle ORM (2 tables: `llm_providers`, `llm_settings`)
- **Backend**: Express.js with service-layer architecture
- **Frontend**: React with ShadCN components
- **Security**: Encrypted API key storage using AES-256-GCM
- **Rate Limiting**: Leverages existing rate limiting middleware
- **Isolation**: Global settings only in MVP (organizationId always NULL)

---

## 1. Database Schema (MVP)

### Table 1: `llm_providers`

**Purpose:** Store AI provider configurations and API credentials

```typescript
export const llmProviders = pgTable("llm_providers", {
  // Primary Identifiers
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
});
```

**Indexes:**
```typescript
// Unique active provider names
index("llm_providers_name_idx").on(table.name);
index("llm_providers_active_idx").on(table.isActive);
```

---

### Table 2: `llm_settings`

**Purpose:** Store global LLM configuration settings (organization-level settings deferred to Phase 2)

```typescript
export const llmSettings = pgTable("llm_settings", {
  // Primary Identifiers
  id: serial("id").primaryKey(),
  
  // Scope & Isolation
  organizationId: integer("organization_id")
    .references(() => organizations.id, { onDelete: 'cascade' }), // NULL = global settings (always NULL in MVP)
  providerId: integer("provider_id")
    .references(() => llmProviders.id, { onDelete: 'cascade' }),
  
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
});
```

**Indexes:**
```typescript
// Unique constraint: one active setting per provider (organizationId is NULL in MVP)
// Note: Index includes organizationId for future Phase 2 support, but it will always be NULL in MVP
index("llm_settings_org_provider_idx").on(
  table.organizationId,
  table.providerId
);

// Fast lookups
index("llm_settings_org_idx").on(table.organizationId); // For future Phase 2
index("llm_settings_provider_idx").on(table.providerId);
index("llm_settings_active_idx").on(table.isActive);
```

---

### Settings Resolution Logic (MVP)

**MVP Scope:** Only global settings are supported. The `organizationId` field exists in the schema but is always `NULL` in MVP.

**Resolution (MVP):**

1. **Global Settings** (`organizationId = NULL`)
   - System-wide defaults
   - Only settings type available in MVP
   - Example: Global OpenAI settings with default temperature

**Resolution Example:**
```typescript
// Get effective settings for provider (organizationId is ignored in MVP)
const settings = await getEffectiveSettings(null, 'openai');
// Returns: global settings for the provider, or hardcoded defaults
```

**Note:** Organization-level settings and constraints are planned for Phase 2 but are not implemented in MVP.

---

### Future Schema Extensions (Deferred to Phase 2+)

When needed, add these tables:
- `feature_llm_overrides` - Per-feature configuration
- `org_llm_budgets` - Cost management and budgets
- `llm_pii_settings` - PII redaction configuration
- `llm_rate_limits` - Advanced rate limiting (if needed beyond existing middleware)
- `llm_settings_audit` - Settings change history

---

## 2. Backend Implementation (MVP)

### 2.1 Repository Layer

#### `server/repositories/llm-providers.repository.ts`

**Methods:**
- `create(data)` - Create new provider
- `getById(id)` - Get provider by ID
- `getByName(name)` - Get provider by name (e.g., "openai")
- `getAll()` - Get all providers
- `getActive()` - Get all active providers
- `update(id, data)` - Update provider
- `delete(id)` - Delete provider
- `setApiKey(providerId, apiKey)` - Set encrypted API key
- `getApiKey(providerId)` - Get decrypted API key (internal use only)

**Features:**
- Implements `BaseRepository` pattern
- API key encryption/decryption helpers
- Provider validation

#### `server/repositories/llm-settings.repository.ts`

**Methods:**
- `create(data)` - Create new settings entry
- `getById(id)` - Get settings by ID
- `update(id, data)` - Update settings
- `delete(id)` - Delete settings
- `getGlobalSettings(providerId?)` - Get global settings (organizationId = NULL)
- `getByProvider(providerId)` - Get settings for a provider (MVP: only global settings)

**Note:** Organization-specific methods (`getOrganizationSettings`, `getByOrgAndProvider`) are deferred to Phase 2.

**Features:**
- Implements `BaseRepository` pattern
- Settings hierarchy queries
- Validation logic

---

### 2.2 Service Layer

#### `server/services/llm-providers.service.ts`

**Methods:**
- `getAllProviders()` - Get all providers (masked API keys)
- `getProvider(id)` - Get provider by ID
- `createProvider(data)` - Create new provider
- `updateProvider(id, data)` - Update provider
- `deleteProvider(id)` - Delete provider
- `setProviderApiKey(providerId, apiKey)` - Set encrypted API key
- `getProviderApiKey(providerId)` - Get decrypted API key (internal only)
- `validateApiKeyFormat(provider, apiKey)` - Validate API key format

#### `server/services/llm-settings.service.ts`

**Methods:**
- `getEffectiveSettings(providerId)` - Get effective settings for provider (MVP: returns global settings only)
- `getGlobalSettings(providerId?)` - Get global settings
- `createOrUpdateGlobalSettings(providerId, data)` - Upsert global settings
- `deleteSettings(id)` - Delete settings

**Note:** Organization-specific methods (`getOrganizationSettings`, `createOrUpdateOrgSettings`, `mergeSettings`) are deferred to Phase 2. In MVP, `organizationId` parameter is ignored and always treated as NULL.

**Features:**
- Global settings resolution only (MVP)
- Fallback to sensible defaults if no settings exist
- Validation and error handling

**Note:** Organization-level hierarchy resolution is deferred to Phase 2.

**Settings Resolution Example (MVP):**
```typescript
async getEffectiveSettings(providerId: number) {
  // MVP: Only global settings are supported (organizationId is always NULL)
  const globalSettings = await this.repo.getGlobalSettings(providerId);
  if (globalSettings) return globalSettings;
  
  // Fallback to hardcoded defaults
  return DEFAULT_LLM_SETTINGS;
}

// Note: Organization-level settings resolution will be added in Phase 2
```

---

### 2.3 Controller Layer

**File:** `server/controllers/llm-settings.controller.ts`

**Provider Endpoints:**
- `GET /api/llm/providers` - Get all providers (admin only, API keys masked)
- `GET /api/llm/providers/:id` - Get provider by ID (admin only)
- `POST /api/llm/providers` - Create provider (admin only)
- `PUT /api/llm/providers/:id` - Update provider (admin only)
- `DELETE /api/llm/providers/:id` - Delete provider (admin only)
- `POST /api/llm/providers/:id/api-key` - Set provider API key (admin only)

**Settings Endpoints:**
- `GET /api/llm/settings` - Get effective settings (MVP: returns global settings)
- `GET /api/llm/settings/global` - Get global settings (admin only)
- `POST /api/llm/settings/global` - Create/update global settings (admin only)
- `PUT /api/llm/settings/:id` - Update settings (admin only)
- `DELETE /api/llm/settings/:id` - Delete settings (admin only)

**Note:** Organization-specific endpoints (`/api/llm/settings/organization/:orgId`) are deferred to Phase 2.

**Features:**
- Request validation with Zod schemas
- Admin-only access for write operations
- API keys never returned in responses (always masked)
- Standardized API responses

---

### 2.4 API Routes

**File:** `server/routes.ts`

**Provider Routes:**
```typescript
// Use existing rate limiting middleware
router.get('/api/llm/providers', authMiddleware, adminOnly, generalLimiter, LLMSettingsController.getAllProviders);
router.get('/api/llm/providers/:id', authMiddleware, adminOnly, generalLimiter, LLMSettingsController.getProvider);
router.post('/api/llm/providers', authMiddleware, adminOnly, sensitiveOperationsLimiter, validateSchema(providerCreateSchema), LLMSettingsController.createProvider);
router.put('/api/llm/providers/:id', authMiddleware, adminOnly, sensitiveOperationsLimiter, validateSchema(providerUpdateSchema), LLMSettingsController.updateProvider);
router.delete('/api/llm/providers/:id', authMiddleware, adminOnly, sensitiveOperationsLimiter, LLMSettingsController.deleteProvider);
router.post('/api/llm/providers/:id/api-key', authMiddleware, adminOnly, sensitiveOperationsLimiter, validateSchema(apiKeySchema), LLMSettingsController.setApiKey);
```

**Settings Routes:**
```typescript
router.get('/api/llm/settings', authMiddleware, generalLimiter, LLMSettingsController.getEffectiveSettings);
router.get('/api/llm/settings/global', authMiddleware, adminOnly, generalLimiter, LLMSettingsController.getGlobalSettings);
router.post('/api/llm/settings/global', authMiddleware, adminOnly, sensitiveOperationsLimiter, validateSchema(settingsCreateSchema), LLMSettingsController.createGlobalSettings);
router.put('/api/llm/settings/:id', authMiddleware, adminOnly, sensitiveOperationsLimiter, validateSchema(settingsUpdateSchema), LLMSettingsController.updateSettings);
router.delete('/api/llm/settings/:id', authMiddleware, adminOnly, sensitiveOperationsLimiter, LLMSettingsController.deleteSettings);

// Note: Organization-specific routes deferred to Phase 2:
// router.get('/api/llm/settings/organization/:orgId', ...);
// router.post('/api/llm/settings/organization/:orgId', ...);
```

**Middleware Applied:**
- `authMiddleware` - Authentication required
- `adminOnly` - Admin-only access for write operations
- `generalLimiter` - Existing general rate limiting (100 req/15min)
- `sensitiveOperationsLimiter` - Existing sensitive ops rate limiting (10 req/5min)
- `validateSchema()` - Zod schema validation

---

## 3. Frontend Implementation (MVP)

### 3.1 Settings Page Structure

**File:** `client/src/pages/dashboard-llm-settings/index.tsx`

**MVP Tabbed Interface:**
- **Providers** - Configure AI providers (OpenAI, Anthropic, etc.)
  - Add/edit/delete providers
  - Set API keys (masked input)
  - Configure available models
  - Set default model per provider
  - Enable/disable providers
  
- **Defaults** - Set default LLM parameters
  - Temperature (0.0 - 2.0)
  - Max tokens
  - Top P
  - Frequency penalty
  - Presence penalty
  - Retry settings
  - Timeout settings
  - Logging preferences

**Deferred to Phase 2:**
- Organization Settings tab (organization-level overrides)
- Feature-specific overrides tab
- Cost management tab
- Advanced rate limiting configuration tab
- PII redaction settings tab

---

### 3.2 MVP Components

**Files:**

#### `client/src/pages/dashboard-llm-settings/components/ProviderSettings.tsx`
**Purpose:** Manage AI providers (CRUD operations)

**Features:**
- Provider list with cards
- Add provider modal
- Edit provider form
- API key input (password field, never displayed)
- Available models configuration (JSON array input)
- Default model selection
- Active/inactive toggle

#### `client/src/pages/dashboard-llm-settings/components/DefaultSettings.tsx`
**Purpose:** Configure default LLM parameters

**Features:**
- Global defaults form
- Slider inputs for temperature, topP
- Number inputs for tokens, retries, timeouts
- Logging toggles
- Real-time validation
- Preview of effective settings

**Note:** Organization-specific defaults are deferred to Phase 2.

#### `client/src/pages/dashboard-llm-settings/components/SettingsHierarchy.tsx`
**Purpose:** Visualize settings (deferred to Phase 2)

**Note:** This component is deferred to Phase 2 when organization-level settings are implemented. In MVP, only global settings are displayed.

---

### 3.3 Types

**File:** `client/src/pages/dashboard-llm-settings/types.ts`

```typescript
export interface LLMProvider {
  id: number;
  name: string; // "openai", "anthropic"
  displayName: string; // "OpenAI", "Anthropic"
  description?: string;
  apiKeyEncrypted?: string; // Never sent to frontend
  apiKeyMasked?: string; // "sk-...****" (for display only)
  apiBaseUrl?: string;
  availableModels: string[];
  defaultModel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LLMSettings {
  id: number;
  organizationId: number | null; // null = global (always null in MVP)
  providerId: number;
  preferredModel?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxRetries: number;
  retryBackoffMs: number;
  requestTimeoutMs: number;
  enableLogging: boolean;
  logLevel: 'full' | 'minimal' | 'errors_only';
  logRequestData: boolean;
  logResponseData: boolean;
  customSettings?: Record<string, any>; // For future extensions
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveSettings extends LLMSettings {
  provider: LLMProvider;
  isOverridden: boolean; // Always false in MVP (no org overrides)
}
```

---

### 3.4 API Client

**File:** `client/src/lib/api/llm-settings.ts`

```typescript
export const llmSettingsApi = {
  // Providers
  getProviders: () => api.get<LLMProvider[]>('/api/llm/providers'),
  getProvider: (id: number) => api.get<LLMProvider>(`/api/llm/providers/${id}`),
  createProvider: (data: Partial<LLMProvider>) => api.post<LLMProvider>('/api/llm/providers', data),
  updateProvider: (id: number, data: Partial<LLMProvider>) => api.put<LLMProvider>(`/api/llm/providers/${id}`, data),
  deleteProvider: (id: number) => api.delete(`/api/llm/providers/${id}`),
  setProviderApiKey: (id: number, apiKey: string) => api.post(`/api/llm/providers/${id}/api-key`, { apiKey }),
  
  // Settings
  getEffectiveSettings: () => api.get<EffectiveSettings>('/api/llm/settings'),
  getGlobalSettings: (providerId?: number) => api.get<LLMSettings[]>('/api/llm/settings/global', { params: { providerId } }),
  createGlobalSettings: (providerId: number, data: Partial<LLMSettings>) => api.post<LLMSettings>('/api/llm/settings/global', { providerId, ...data }),
  updateSettings: (id: number, data: Partial<LLMSettings>) => api.put<LLMSettings>(`/api/llm/settings/${id}`, data),
  deleteSettings: (id: number) => api.delete(`/api/llm/settings/${id}`),
  
  // Note: Organization-specific methods deferred to Phase 2:
  // getOrgSettings, createOrgSettings
};
```

---

### 3.5 Navigation

**File:** `client/src/components/layout/dashboard/sidebar.tsx`

**Update:**
```typescript
// Add to llmNavItems array
{
  name: 'Settings',
  href: '/dashboard/admin/llm/settings',
  icon: Settings,
  adminOnly: true, // Only show to admins
}
```

**File:** `client/src/App.tsx`

**Update:**
```typescript
<Route
  path="/dashboard/admin/llm/settings"
  element={
    <AdminProtectedRoute>
      <LLMSettingsPage />
    </AdminProtectedRoute>
  }
/>
```

---

## 4. Security Considerations (MVP)

### 4.1 API Key Encryption

**Implementation:**
- Use AES-256-GCM encryption via Node.js `crypto` module
- Store encryption key in environment variable (`LLM_ENCRYPTION_KEY`)
- **Never return decrypted API keys in API responses**
- Return masked keys for display: `"sk-...****"`

**Encryption Flow:**
1. Admin submits API key via secure HTTPS form (password input)
2. Backend encrypts using AES-256-GCM
3. Store only encrypted key in database
4. Decrypt only when making API calls to LLM providers (in-memory only, never logged)

**Encryption Utility:**
```typescript
// server/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY!; // 32-byte key

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 7)}...****`;
}
```

**Environment Setup:**
```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
LLM_ENCRYPTION_KEY=<generated-key-here>
```

---

### 4.2 Access Control

**MVP Access Levels:**
- ✅ **Read Providers**: Admin only
- ✅ **Write Providers**: Admin only
- ✅ **Read Settings**: Authenticated users (MVP: returns global settings only)
- ✅ **Write Settings**: Admin only
- ✅ **Set API Keys**: Admin only
- ❌ **View API Keys**: NEVER (only masked versions returned)

**Note:** Organization-level access control and settings isolation are deferred to Phase 2. Constraints (budgets, rate limits, etc.) are also deferred to future phases.

**Implementation:**
```typescript
// Middleware: server/middleware/admin.ts
export const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  next();
};
```

---

### 4.3 Validation

**Backend Validation (Zod Schemas):**

```typescript
// server/middleware/schemas.ts

export const providerCreateSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  apiBaseUrl: z.string().url().optional(),
  availableModels: z.array(z.string()).min(1),
  defaultModel: z.string().optional(),
});

export const apiKeySchema = z.object({
  apiKey: z.string().min(10).max(500), // Validate length
});

export const settingsCreateSchema = z.object({
  providerId: z.number().int().positive(),
  preferredModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(100000).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryBackoffMs: z.number().int().min(100).max(10000).optional(),
  requestTimeoutMs: z.number().int().min(1000).max(300000).optional(),
  logLevel: z.enum(['full', 'minimal', 'errors_only']).optional(),
});
```

**Frontend Validation:**
- Use same schemas on frontend (shared types)
- Real-time validation on form inputs
- Clear error messages

---

## 5. Integration Points (MVP)

### 5.1 AIService Integration

**File:** `server/services/ai.service.ts`

**Updates Required:**
1. Load settings from `LLMSettingsService` before making API calls
2. Use effective settings (MVP: global settings only, organizationId ignored)
3. Use encrypted API keys from provider settings
4. Apply configured LLM parameters (temperature, tokens, etc.)
5. Respect retry and timeout settings

**Note:** Organization-specific settings resolution is deferred to Phase 2. In MVP, `organizationId` parameter is ignored.

**Integration Example:**
```typescript
// server/services/ai.service.ts

import { LLMSettingsService } from './llm-settings.service';
import { LLMProvidersService } from './llm-providers.service';

export class AIService {
  async generateCompletion(
    userId: number,
    organizationId: number | null, // Ignored in MVP, kept for API compatibility
    prompt: string,
    providerName: string = 'openai'
  ) {
    // 1. Get provider
    const provider = await LLMProvidersService.getProviderByName(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }
    
    // 2. Get decrypted API key
    const apiKey = await LLMProvidersService.getProviderApiKey(provider.id);
    if (!apiKey) {
      throw new Error(`API key not configured for ${providerName}`);
    }
    
    // 3. Get effective settings (MVP: global settings only, organizationId ignored)
    const settings = await LLMSettingsService.getEffectiveSettings(
      provider.id
    );
    
    // 4. Make API call with configured settings
    const openai = new OpenAI({
      apiKey,
      baseURL: provider.apiBaseUrl || undefined,
      timeout: settings.requestTimeoutMs,
      maxRetries: settings.maxRetries,
    });
    
    const response = await openai.chat.completions.create({
      model: settings.preferredModel || provider.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      frequency_penalty: settings.frequencyPenalty,
      presence_penalty: settings.presencePenalty,
    });
    
    // 5. Log if enabled
    if (settings.enableLogging) {
      await LLMLogService.create({
        userId,
        organizationId: null, // MVP: organizationId is null
        providerId: provider.id,
        model: settings.preferredModel || provider.defaultModel,
        // ... log data based on settings.logRequestData, etc.
      });
    }
    
    return response;
  }
}
```

---

### 5.2 LLMLogService Integration

**File:** `server/services/llm-log.service.ts`

**Updates Required:**
1. Check logging preferences from settings before logging
2. Apply log level filtering (`full`, `minimal`, `errors_only`)
3. Respect `logRequestData` and `logResponseData` flags
4. Skip logging if `enableLogging` is false

**Integration Example:**
```typescript
// server/services/llm-log.service.ts

async create(data: LLMLogCreateData) {
  // Get settings to check logging preferences (MVP: organizationId ignored)
  const settings = await LLMSettingsService.getEffectiveSettings(
    data.providerId
  );
  
  // Skip if logging disabled
  if (!settings.enableLogging) {
    return null;
  }
  
  // Apply log level filtering
  const logData: any = {
    userId: data.userId,
    organizationId: data.organizationId,
    providerId: data.providerId,
    model: data.model,
    status: data.status,
    // Always log basic info
  };
  
  // Full logging
  if (settings.logLevel === 'full') {
    if (settings.logRequestData) {
      logData.prompt = data.prompt;
      logData.parameters = data.parameters;
    }
    if (settings.logResponseData) {
      logData.response = data.response;
    }
    logData.tokenUsage = data.tokenUsage;
    logData.cost = data.cost;
  }
  
  // Minimal logging
  else if (settings.logLevel === 'minimal') {
    logData.tokenUsage = data.tokenUsage;
    logData.cost = data.cost;
    // No request/response data
  }
  
  // Errors only
  else if (settings.logLevel === 'errors_only') {
    if (data.status === 'error') {
      logData.error = data.error;
    } else {
      return null; // Don't log successful requests
    }
  }
  
  return await LLMLogRepository.create(logData);
}
```

---

### 5.3 Migration from Environment Variables

**Current State:** API keys likely stored in `.env`
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Migration Script:** `scripts/migrate-api-keys.ts`

```typescript
// One-time migration script
import { LLMProvidersService } from '../services/llm-providers.service';
import env from '../config/env';

async function migrateApiKeys() {
  console.log('Migrating API keys to database...');
  
  // Migrate OpenAI
  if (env.OPENAI_API_KEY) {
    const openai = await LLMProvidersService.createProvider({
      name: 'openai',
      displayName: 'OpenAI',
      availableModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4-turbo',
      isActive: true,
    });
    
    await LLMProvidersService.setProviderApiKey(openai.id, env.OPENAI_API_KEY);
    console.log('✓ Migrated OpenAI API key');
  }
  
  // Migrate Anthropic
  if (env.ANTHROPIC_API_KEY) {
    const anthropic = await LLMProvidersService.createProvider({
      name: 'anthropic',
      displayName: 'Anthropic',
      availableModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      defaultModel: 'claude-3-sonnet',
      isActive: true,
    });
    
    await LLMProvidersService.setProviderApiKey(anthropic.id, env.ANTHROPIC_API_KEY);
    console.log('✓ Migrated Anthropic API key');
  }
  
  console.log('Migration complete. You can now remove API keys from .env');
}
```

---

## 6. Database Migration Strategy (MVP)

### 6.1 Create Tables Migration

**File:** `server/db/migrations/XXXX_create_llm_providers_and_settings.ts`

```typescript
import { sql } from 'drizzle-orm';

export async function up(db) {
  // Create llm_providers table
  await db.execute(sql`
    CREATE TABLE llm_providers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      api_key_encrypted TEXT,
      api_base_url TEXT,
      available_models JSONB NOT NULL,
      default_model TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    CREATE INDEX idx_llm_providers_name ON llm_providers(name);
    CREATE INDEX idx_llm_providers_active ON llm_providers(is_active);
  `);
  
  // Create llm_settings table
  await db.execute(sql`
    CREATE TABLE llm_settings (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      provider_id INTEGER REFERENCES llm_providers(id) ON DELETE CASCADE,
      preferred_model TEXT,
      temperature REAL DEFAULT 0.7,
      max_tokens INTEGER DEFAULT 2000,
      top_p REAL DEFAULT 1.0,
      frequency_penalty REAL DEFAULT 0,
      presence_penalty REAL DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      retry_backoff_ms INTEGER DEFAULT 1000,
      request_timeout_ms INTEGER DEFAULT 60000,
      enable_logging BOOLEAN DEFAULT true,
      log_level TEXT DEFAULT 'full',
      log_request_data BOOLEAN DEFAULT true,
      log_response_data BOOLEAN DEFAULT true,
      custom_settings JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    CREATE INDEX idx_llm_settings_org_provider ON llm_settings(organization_id, provider_id);
    CREATE INDEX idx_llm_settings_org ON llm_settings(organization_id);
    CREATE INDEX idx_llm_settings_provider ON llm_settings(provider_id);
  `);
}

export async function down(db) {
  await db.execute(sql`DROP TABLE IF EXISTS llm_settings CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS llm_providers CASCADE;`);
}
```

---

### 6.2 Seed Default Providers

**File:** `server/db/seeds/llm-providers.seed.ts`

```typescript
// Optional: Seed default providers
export async function seedLLMProviders(db) {
  await db.insert(llmProviders).values([
    {
      name: 'openai',
      displayName: 'OpenAI',
      description: 'OpenAI GPT models',
      availableModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4-turbo',
      isActive: false, // Admin must add API key
    },
    {
      name: 'anthropic',
      displayName: 'Anthropic',
      description: 'Anthropic Claude models',
      availableModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      defaultModel: 'claude-3-sonnet',
      isActive: false,
    },
  ]);
}
```

---

### 6.3 Migration from Environment Variables

**Run after deployment:**

```bash
# Generate encryption key (first time only)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
LLM_ENCRYPTION_KEY=<your-generated-key>

# Run migration script
npm run migrate-api-keys
```

See migration script in Section 5.3 above.

---

## 7. Testing Strategy (MVP)

### 7.1 Unit Tests (Priority)

**Repository Tests:**
```typescript
// __tests__/repositories/llm-providers.repository.test.ts
- create() - Create provider
- getById() - Get provider by ID
- getByName() - Get by name
- getAll() - Get all providers
- update() - Update provider
- delete() - Delete provider
```

```typescript
// __tests__/repositories/llm-settings.repository.test.ts
- create() - Create settings
- getGlobalSettings() - Get global settings
- getOrganizationSettings() - Get org settings
- getByOrgAndProvider() - Get specific settings
```

**Service Tests:**
```typescript
// __tests__/services/llm-providers.service.test.ts
- setProviderApiKey() - Encrypts and stores API key
- getProviderApiKey() - Decrypts API key
- maskApiKey() - Returns masked key
```

```typescript
// __tests__/services/llm-settings.service.test.ts
- getEffectiveSettings() - Test org → global fallback
- mergeSettings() - Test settings merging logic
```

**Utility Tests:**
```typescript
// __tests__/utils/encryption.test.ts
- encryptApiKey() - Encrypts correctly
- decryptApiKey() - Decrypts correctly
- Round-trip test (encrypt → decrypt = original)
```

---

### 7.2 Integration Tests (Phase 2)

- Settings hierarchy resolution end-to-end
- AIService integration with settings
- LLMLogService integration with settings

---

### 7.3 E2E Tests (Phase 3)

- Settings page UI interactions
- Provider CRUD operations
- API key management flow

---

## 8. Implementation Phases (MVP)

### ✅ Phase 1: Database Foundation (Week 1)
1. Create database schema (2 tables)
2. Run migrations
3. Create seed data (optional)

### ✅ Phase 2: Backend Implementation (Week 1-2)
4. Implement encryption utilities
5. Create repositories (providers + settings)
6. Create services (providers + settings)
7. Create controllers
8. Add API routes with validation
9. Write unit tests

### ✅ Phase 3: Frontend Implementation (Week 2-3)
10. Create settings page structure
11. Implement Providers tab (CRUD UI)
12. Implement Defaults tab (settings form)
13. Add API client methods
14. Add navigation/routing

### ✅ Phase 4: Integration (Week 3)
15. Migrate existing API keys from env
16. Integrate with AIService
17. Integrate with LLMLogService
18. Test end-to-end

### ✅ Phase 5: Polish & Deploy (Week 4)
19. Fix bugs and edge cases
20. Add loading states and error handling
21. Write admin documentation
22. Deploy to staging
23. User acceptance testing
24. Deploy to production

---

### 🔜 Future Phases (Post-MVP)

**Phase 6: Feature Overrides (Month 2)**
- Add `feature_llm_overrides` table
- UI for feature-specific settings
- Update AIService to use feature overrides

**Phase 7: Cost Management (Month 2-3)**
- Add `org_llm_budgets` table
- Cost tracking and alerts
- Budget visualization UI

**Phase 8: Advanced Features (Month 3+)**
- PII redaction configuration
- Settings audit log
- Settings templates/presets
- Import/export settings

---

## 9. Best Practices (MVP)

### 9.1 Settings Hierarchy (MVP)

**MVP Resolution (Simplified):**
1. **Global settings** (only type available in MVP)
2. **Hardcoded defaults** (fallback if no global settings exist)

**Implementation:**
```typescript
// MVP: Only global settings are supported (organizationId ignored)
const settings = await LLMSettingsService.getEffectiveSettings(providerId);
```

**Note:** Organization-level settings hierarchy will be implemented in Phase 2.

---

### 9.2 API Key Security (CRITICAL)

**✅ DO:**
- Use AES-256-GCM encryption
- Store encryption key in environment variable (`.env`, NOT in code)
- Return masked keys in API responses: `"sk-...****"`
- Use password input fields in UI
- Decrypt keys only in-memory when needed
- Use HTTPS for all API communication

**❌ DON'T:**
- Never log decrypted API keys
- Never return decrypted keys in API responses
- Never store keys in plain text
- Never commit encryption keys to Git
- Never display full keys in UI

---

### 9.3 Performance Optimization (Future)

**For Phase 2+:**
- Cache effective settings in memory (with TTL)
- Use Redis for caching across multiple servers
- Minimize database queries in hot paths

**MVP: Keep it simple, optimize later if needed**

---

### 9.4 Error Handling

**Graceful Degradation:**
```typescript
// Always provide sensible defaults (MVP: organizationId ignored)
async getEffectiveSettings(providerId) {
  try {
    const globalSettings = await this.repo.getGlobalSettings(providerId);
    if (globalSettings) return globalSettings;
    
    // Fallback to hardcoded defaults
    return DEFAULT_LLM_SETTINGS;
  } catch (error) {
    logger.error('Failed to get effective settings', { error, providerId });
    return DEFAULT_LLM_SETTINGS; // Never fail, always return something usable
  }
}
```

---

### 9.5 Validation

**Backend validation is MANDATORY:**
- Always validate with Zod schemas
- Reject invalid data with clear error messages
- Validate numeric ranges (temperature 0-2, etc.)

**Frontend validation is UX:**
- Real-time validation feedback
- Prevent submission of invalid data
- Same validation rules as backend

---

## 10. Deployment Checklist

### Pre-Deployment
- [ ] Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `LLM_ENCRYPTION_KEY` to `.env` (all environments)
- [ ] Run database migrations
- [ ] Run API key migration script (if migrating from env vars)
- [ ] Test encryption/decryption works

### Post-Deployment
- [ ] Verify providers are created
- [ ] Add API keys via admin UI
- [ ] Test effective settings resolution
- [ ] Verify AIService uses settings correctly
- [ ] Check logging preferences work
- [ ] Monitor for errors

---

## 11. Summary

This **MVP implementation plan** provides a pragmatic, two-table foundation for managing LLM settings in a secure and maintainable way. The design prioritizes simplicity while remaining extensible for future enhancements.

### MVP Scope (4 Weeks)
- ✅ Two-table design (`llm_providers`, `llm_settings`)
- ✅ Encrypted API key storage
- ✅ Global settings only (organizationId always NULL in MVP)
- ✅ LLM parameter configuration (temperature, tokens, etc.)
- ✅ Logging preferences
- ✅ Admin UI for provider and settings management
- ✅ Integration with existing AIService and LLMLogService

**Not in MVP:**
- ❌ Organization-level settings (deferred to Phase 2)
- ❌ Constraints (budgets, rate limits, etc.) - deferred to future phases

### Deferred to Future Phases
- 🔜 Organization-level settings (Phase 2)
- 🔜 Constraints (budgets, rate limits, etc.) (Phase 2+)
- 🔜 Feature-specific overrides (Phase 2)
- 🔜 Cost management and budgets (Phase 2)
- 🔜 Advanced rate limiting configuration (Phase 2)
- 🔜 PII redaction settings (Phase 2)
- 🔜 Settings audit log (Phase 3)
- 🔜 Settings templates (Phase 3)

### Key Benefits
- ✅ **Simple**: Just 2 tables, easy to understand and maintain
- ✅ **Secure**: AES-256-GCM encryption, admin-only access
- ✅ **Flexible**: JSONB `customSettings` field for future extensions
- ✅ **Extensible**: Easy to add new tables for advanced features
- ✅ **MVP-Ready**: Focused on essential features only

---

**Last Updated:** January 2025  
**Status:** 📋 **READY FOR IMPLEMENTATION (MVP)**  
**Estimated Timeline:** 3-4 weeks

