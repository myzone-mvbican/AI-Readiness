// Types for LLM Settings based on the implementation plan

export interface LLMProvider {
  id: number;
  name: string; // "openai", "anthropic", "google"
  displayName: string; // "OpenAI", "Anthropic", "Google AI"
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

// Form types for creating/updating providers
export interface ProviderFormData {
  name: string;
  displayName: string;
  description?: string;
  apiBaseUrl?: string;
  availableModels: string[];
  defaultModel?: string;
  isActive: boolean;
}

// Form types for creating/updating settings
export interface SettingsFormData {
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
}

