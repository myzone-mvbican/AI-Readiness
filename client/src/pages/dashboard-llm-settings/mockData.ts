// Mock data for LLM Settings - used for frontend development before backend is ready

import { LLMProvider, LLMSettings } from './types';

export const mockProviders: LLMProvider[] = [
  {
    id: 1,
    name: 'openai',
    displayName: 'OpenAI',
    description: 'OpenAI GPT models including GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo',
    apiKeyMasked: 'sk-proj-...****',
    apiBaseUrl: 'https://api.openai.com/v1',
    availableModels: [
      'gpt-4',
      'gpt-4-turbo-preview',
      'gpt-4-0125-preview',
      'gpt-4-1106-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-1106',
    ],
    defaultModel: 'gpt-4-turbo-preview',
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'anthropic',
    displayName: 'Anthropic',
    description: 'Anthropic Claude models including Claude 3 Opus, Sonnet, and Haiku',
    apiKeyMasked: 'sk-ant-...****',
    apiBaseUrl: 'https://api.anthropic.com',
    availableModels: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
    ],
    defaultModel: 'claude-3-sonnet-20240229',
    isActive: true,
    createdAt: '2025-01-15T10:05:00Z',
    updatedAt: '2025-01-15T10:05:00Z',
  },
  {
    id: 3,
    name: 'google',
    displayName: 'Google AI',
    description: 'Google Gemini models including Gemini Pro and Gemini Ultra',
    apiKeyMasked: undefined, // No API key set yet
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1',
    availableModels: [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-ultra',
    ],
    defaultModel: 'gemini-pro',
    isActive: false, // Inactive because no API key
    createdAt: '2025-01-15T10:10:00Z',
    updatedAt: '2025-01-15T10:10:00Z',
  },
  {
    id: 4,
    name: 'cohere',
    displayName: 'Cohere',
    description: 'Cohere command and chat models',
    apiKeyMasked: undefined,
    apiBaseUrl: 'https://api.cohere.ai/v1',
    availableModels: [
      'command',
      'command-light',
      'command-nightly',
      'command-light-nightly',
    ],
    defaultModel: 'command',
    isActive: false,
    createdAt: '2025-01-15T10:15:00Z',
    updatedAt: '2025-01-15T10:15:00Z',
  },
  {
    id: 5,
    name: 'mistral',
    displayName: 'Mistral AI',
    description: 'Mistral AI models including Mistral Large and Mistral Medium',
    apiKeyMasked: undefined,
    apiBaseUrl: 'https://api.mistral.ai/v1',
    availableModels: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b',
    ],
    defaultModel: 'mistral-large-latest',
    isActive: false,
    createdAt: '2025-01-15T10:20:00Z',
    updatedAt: '2025-01-15T10:20:00Z',
  },
];

export const mockSettings: LLMSettings[] = [
  {
    id: 1,
    organizationId: null, // Global settings (MVP)
    providerId: 1, // OpenAI
    preferredModel: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxRetries: 3,
    retryBackoffMs: 1000,
    requestTimeoutMs: 60000,
    enableLogging: true,
    logLevel: 'full',
    logRequestData: true,
    logResponseData: true,
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    organizationId: null, // Global settings (MVP)
    providerId: 2, // Anthropic
    preferredModel: 'claude-3-sonnet-20240229',
    temperature: 0.8,
    maxTokens: 4000,
    topP: 0.95,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxRetries: 3,
    retryBackoffMs: 1000,
    requestTimeoutMs: 60000,
    enableLogging: true,
    logLevel: 'full',
    logRequestData: true,
    logResponseData: true,
    isActive: true,
    createdAt: '2025-01-15T10:05:00Z',
    updatedAt: '2025-01-15T10:05:00Z',
  },
];

// Helper function to get settings for a provider
export function getSettingsForProvider(providerId: number): LLMSettings | undefined {
  return mockSettings.find(s => s.providerId === providerId && s.isActive);
}

// Helper function to get provider by ID
export function getProviderById(id: number): LLMProvider | undefined {
  return mockProviders.find(p => p.id === id);
}

// Helper function to get active providers
export function getActiveProviders(): LLMProvider[] {
  return mockProviders.filter(p => p.isActive);
}

