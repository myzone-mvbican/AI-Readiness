import { LLMProvidersRepository, InsertLLMProvider, UpdateLLMProvider } from "../repositories/llm-providers.repository";
import { encryptApiKey, decryptApiKey, maskApiKey, validateApiKeyFormat } from "../utils/encryption";
import { NotFoundError, ValidationError, InternalServerError } from "../utils/errors";

export class LLMProvidersService {
  private static repository = new LLMProvidersRepository();

  /**
   * Get a masked API key display value for a provider
   * Since we can't decrypt just to mask, we return a provider-specific masked format
   */
  private static getMaskedApiKeyForProvider(providerName: string): string {
    const prefixes: Record<string, string> = {
      openai: 'sk-proj-...****',
      anthropic: 'sk-ant-...****',
      google: 'AIza...****',
      cohere: 'co...****',
      mistral: 'mistral...****',
    };
    
    return prefixes[providerName.toLowerCase()] || '****';
  }

  /**
   * Get all providers (API keys are masked)
   */
  static async getAllProviders() {
    try {
      const providers = await this.repository.getAll();
      
      // Mask API keys for response
      // Note: We can't decrypt just to mask, so we return a generic masked value
      return providers.map(provider => ({
        ...provider,
        apiKeyMasked: provider.apiKeyEncrypted ? this.getMaskedApiKeyForProvider(provider.name) : undefined,
        apiKeyEncrypted: undefined, // Never return encrypted key
      }));
    } catch (error: any) {
      throw new InternalServerError(`Failed to fetch providers: ${error.message}`);
    }
  }

  /**
   * Get provider by ID (API key is masked)
   */
  static async getProvider(id: number) {
    try {
      const provider = await this.repository.getById(id);
      
      if (!provider) {
        throw new NotFoundError(`Provider with id ${id} not found`);
      }
      
      return {
        ...provider,
        apiKeyMasked: provider.apiKeyEncrypted ? this.getMaskedApiKeyForProvider(provider.name) : undefined,
        apiKeyEncrypted: undefined, // Never return encrypted key
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to fetch provider: ${error.message}`);
    }
  }

  /**
   * Get provider by name (API key is masked)
   */
  static async getProviderByName(name: string) {
    try {
      const provider = await this.repository.getByName(name);
      
      if (!provider) {
        throw new NotFoundError(`Provider with name ${name} not found`);
      }
      
      return {
        ...provider,
        apiKeyMasked: provider.apiKeyEncrypted ? this.getMaskedApiKeyForProvider(provider.name) : undefined,
        apiKeyEncrypted: undefined, // Never return encrypted key
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to fetch provider: ${error.message}`);
    }
  }

  /**
   * Create a new provider
   */
  static async createProvider(data: InsertLLMProvider) {
    try {
      // Validate provider name format
      if (!/^[a-z0-9_-]+$/.test(data.name)) {
        throw new ValidationError('Provider name must contain only lowercase letters, numbers, hyphens, and underscores');
      }
      
      // Check if provider with same name already exists
      const existing = await this.repository.getByName(data.name);
      if (existing) {
        throw new ValidationError(`Provider with name ${data.name} already exists`);
      }
      
      // Encrypt API key if provided
      let apiKeyEncrypted: string | undefined;
      if (data.apiKeyEncrypted) {
        // If already encrypted, use as-is (for migrations)
        // Otherwise, encrypt it
        if (!data.apiKeyEncrypted.includes(':')) {
          // Not encrypted, encrypt it
          apiKeyEncrypted = encryptApiKey(data.apiKeyEncrypted);
        } else {
          // Already encrypted
          apiKeyEncrypted = data.apiKeyEncrypted;
        }
      }
      
      const provider = await this.repository.create({
        ...data,
        apiKeyEncrypted,
      });
      
      return {
        ...provider,
        apiKeyMasked: provider.apiKeyEncrypted ? this.getMaskedApiKeyForProvider(provider.name) : undefined,
        apiKeyEncrypted: undefined, // Never return encrypted key
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to create provider: ${error.message}`);
    }
  }

  /**
   * Update provider
   */
  static async updateProvider(id: number, data: UpdateLLMProvider) {
    try {
      const existing = await this.repository.getById(id);
      if (!existing) {
        throw new NotFoundError(`Provider with id ${id} not found`);
      }
      
      // Handle API key encryption if provided
      let apiKeyEncrypted: string | undefined;
      if (data.apiKeyEncrypted !== undefined) {
        if (!data.apiKeyEncrypted.includes(':')) {
          // Not encrypted, encrypt it
          apiKeyEncrypted = encryptApiKey(data.apiKeyEncrypted);
        } else {
          // Already encrypted
          apiKeyEncrypted = data.apiKeyEncrypted;
        }
      }
      
      const provider = await this.repository.update(id, {
        ...data,
        apiKeyEncrypted,
      });
      
      return {
        ...provider,
        apiKeyMasked: provider.apiKeyEncrypted ? this.getMaskedApiKeyForProvider(provider.name) : undefined,
        apiKeyEncrypted: undefined, // Never return encrypted key
      };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update provider: ${error.message}`);
    }
  }

  /**
   * Delete provider
   */
  static async deleteProvider(id: number) {
    try {
      const existing = await this.repository.getById(id);
      if (!existing) {
        throw new NotFoundError(`Provider with id ${id} not found`);
      }
      
      const deleted = await this.repository.delete(id);
      if (!deleted) {
        throw new InternalServerError('Failed to delete provider');
      }
      
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to delete provider: ${error.message}`);
    }
  }

  /**
   * Set API key for a provider (encrypts and stores)
   */
  static async setProviderApiKey(providerId: number, apiKey: string) {
    try {
      const provider = await this.repository.getById(providerId);
      if (!provider) {
        throw new NotFoundError(`Provider with id ${providerId} not found`);
      }
      
      // Validate API key format
      if (!validateApiKeyFormat(provider.name, apiKey)) {
        throw new ValidationError(`Invalid API key format for provider ${provider.name}`);
      }
      
      // Encrypt and store
      const encrypted = encryptApiKey(apiKey);
      await this.repository.setApiKey(providerId, encrypted);
      
      // Activate provider if it was inactive
      if (!provider.isActive) {
        await this.repository.update(providerId, { isActive: true });
      }
      
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError(`Failed to set API key: ${error.message}`);
    }
  }

  /**
   * Get decrypted API key (INTERNAL USE ONLY - never return to frontend)
   */
  static async getProviderApiKey(providerId: number): Promise<string | null> {
    try {
      const encrypted = await this.repository.getApiKey(providerId);
      if (!encrypted) {
        return null;
      }
      
      // Decrypt the API key
      return decryptApiKey(encrypted);
    } catch (error: any) {
      throw new InternalServerError(`Failed to get API key: ${error.message}`);
    }
  }

  /**
   * Validate API key format for a provider
   */
  static validateApiKey(provider: string, apiKey: string): boolean {
    return validateApiKeyFormat(provider, apiKey);
  }
}

