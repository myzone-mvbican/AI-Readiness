import { LLMSettingsRepository, InsertLLMSettings, UpdateLLMSettings } from "../repositories/llm-settings.repository";
import { LLMProvidersService } from "./llm-providers.service";
import { NotFoundError, ValidationError, InternalServerError } from "../utils/errors";

// Default settings fallback (used when no settings exist)
const DEFAULT_LLM_SETTINGS = {
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
};

export class LLMSettingsService {
  private static repository = new LLMSettingsRepository();

  /**
   * Get effective settings for a provider
   * MVP: Returns global settings only (organizationId is always NULL)
   * Falls back to defaults if no settings exist
   */
  static async getEffectiveSettings(providerId: number) {
    try {
      // MVP: Only global settings are supported (organizationId is always NULL)
      const settings = await this.repository.getByProvider(providerId);
      
      if (settings) {
        return settings;
      }
      
      // Fallback to hardcoded defaults
      // Note: In a real implementation, you might want to merge with provider defaults
      const provider = await LLMProvidersService.getProvider(providerId);
      
      return {
        id: 0, // Virtual ID for default settings
        organizationId: null,
        providerId,
        preferredModel: provider.defaultModel || undefined,
        ...DEFAULT_LLM_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to get effective settings: ${error.message}`);
    }
  }

  /**
   * Get global settings
   * MVP: organizationId is always NULL
   */
  static async getGlobalSettings(providerId?: number) {
    try {
      return await this.repository.getGlobalSettings(providerId);
    } catch (error: any) {
      throw new InternalServerError(`Failed to get global settings: ${error.message}`);
    }
  }

  /**
   * Create or update global settings for a provider
   * MVP: organizationId is always NULL
   */
  static async createOrUpdateGlobalSettings(providerId: number, data: InsertLLMSettings) {
    try {
      // Verify provider exists
      await LLMProvidersService.getProvider(providerId);
      
      // Ensure organizationId is null (MVP requirement)
      const settingsData: InsertLLMSettings = {
        ...data,
        organizationId: null, // Always null in MVP
      };
      
      return await this.repository.createOrUpdateGlobalSettings(providerId, settingsData);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError(`Failed to create/update global settings: ${error.message}`);
    }
  }

  /**
   * Update settings by ID
   */
  static async updateSettings(id: number, data: UpdateLLMSettings) {
    try {
      const existing = await this.repository.getById(id);
      if (!existing) {
        throw new NotFoundError(`Settings with id ${id} not found`);
      }
      
      return await this.repository.update(id, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update settings: ${error.message}`);
    }
  }

  /**
   * Delete settings
   */
  static async deleteSettings(id: number) {
    try {
      const existing = await this.repository.getById(id);
      if (!existing) {
        throw new NotFoundError(`Settings with id ${id} not found`);
      }
      
      const deleted = await this.repository.delete(id);
      if (!deleted) {
        throw new InternalServerError('Failed to delete settings');
      }
      
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to delete settings: ${error.message}`);
    }
  }
}

