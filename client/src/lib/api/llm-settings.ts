// API client for LLM Settings
// Uses real backend API endpoints

import { apiRequest } from '@/lib/queryClient';
import { LLMProvider, LLMSettings, EffectiveSettings } from '@/pages/dashboard-llm-settings/types';

export const llmSettingsApi = {
  // Providers
  getProviders: async (): Promise<LLMProvider[]> => {
    try {
      const res = await apiRequest('GET', '/api/llm/providers');
      const result = await res.json();
      return result.data || [];
    } catch (error: any) {
      console.error('Failed to fetch providers:', error);
      throw new Error(error.message || 'Failed to fetch providers');
    }
  },

  getProvider: async (id: number): Promise<LLMProvider> => {
    try {
      const res = await apiRequest('GET', `/api/llm/providers/${id}`);
      const result = await res.json();
      return result.data;
    } catch (error: any) {
      console.error(`Failed to fetch provider ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch provider');
    }
  },

  createProvider: async (data: Partial<LLMProvider>): Promise<LLMProvider> => {
    try {
      const res = await apiRequest('POST', '/api/llm/providers', data);
      const result = await res.json();
      return result.data;
    } catch (error: any) {
      console.error('Failed to create provider:', error);
      throw new Error(error.message || 'Failed to create provider');
    }
  },

  updateProvider: async (id: number, data: Partial<LLMProvider>): Promise<LLMProvider> => {
    try {
      const res = await apiRequest('PUT', `/api/llm/providers/${id}`, data);
      const result = await res.json();
      return result.data;
    } catch (error: any) {
      console.error(`Failed to update provider ${id}:`, error);
      throw new Error(error.message || 'Failed to update provider');
    }
  },

  deleteProvider: async (id: number): Promise<void> => {
    try {
      await apiRequest('DELETE', `/api/llm/providers/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete provider ${id}:`, error);
      throw new Error(error.message || 'Failed to delete provider');
    }
  },

  setProviderApiKey: async (id: number, apiKey: string): Promise<void> => {
    try {
      await apiRequest('POST', `/api/llm/providers/${id}/api-key`, { apiKey });
    } catch (error: any) {
      console.error(`Failed to set API key for provider ${id}:`, error);
      throw new Error(error.message || 'Failed to set API key');
    }
  },

  // Settings
  getEffectiveSettings: async (providerId?: number): Promise<EffectiveSettings[]> => {
    try {
      const url = providerId 
        ? `/api/llm/settings?providerId=${providerId}`
        : '/api/llm/settings';
      const res = await apiRequest('GET', url);
      const result = await res.json();
      // Backend always returns an array
      return Array.isArray(result.data) ? result.data : [];
    } catch (error: any) {
      console.error('Failed to fetch effective settings:', error);
      throw new Error(error.message || 'Failed to fetch effective settings');
    }
  },

  getGlobalSettings: async (providerId?: number): Promise<LLMSettings[]> => {
    try {
      const url = providerId
        ? `/api/llm/settings/global?providerId=${providerId}`
        : '/api/llm/settings/global';
      const res = await apiRequest('GET', url);
      const result = await res.json();
      return result.data || [];
    } catch (error: any) {
      console.error('Failed to fetch global settings:', error);
      throw new Error(error.message || 'Failed to fetch global settings');
    }
  },

  createGlobalSettings: async (providerId: number, data: Partial<LLMSettings>): Promise<LLMSettings> => {
    try {
      const res = await apiRequest('POST', '/api/llm/settings/global', { providerId, ...data });
      const result = await res.json();
      return result.data;
    } catch (error: any) {
      console.error('Failed to create global settings:', error);
      throw new Error(error.message || 'Failed to create global settings');
    }
  },

  updateSettings: async (id: number, data: Partial<LLMSettings>): Promise<LLMSettings> => {
    try {
      const res = await apiRequest('PUT', `/api/llm/settings/${id}`, data);
      const result = await res.json();
      return result.data;
    } catch (error: any) {
      console.error(`Failed to update settings ${id}:`, error);
      throw new Error(error.message || 'Failed to update settings');
    }
  },

  deleteSettings: async (id: number): Promise<void> => {
    try {
      await apiRequest('DELETE', `/api/llm/settings/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete settings ${id}:`, error);
      throw new Error(error.message || 'Failed to delete settings');
    }
  },
};

