import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { LLMProvidersService } from "../services/llm-providers.service";
import { LLMSettingsService } from "../services/llm-settings.service";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../utils/errors";

export class LLMSettingsController {
  /**
   * Get all providers (admin only)
   * GET /api/llm/providers
   */
  static async getAllProviders(req: Request, res: Response) {
    try {
      const providers = await LLMProvidersService.getAllProviders();
      return ApiResponse.success(res, providers);
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to fetch providers");
    }
  }

  /**
   * Get provider by ID (admin only)
   * GET /api/llm/providers/:id
   */
  static async getProvider(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid provider ID" }, "Invalid provider ID");
      }

      const provider = await LLMProvidersService.getProvider(id);
      return ApiResponse.success(res, provider);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to fetch provider");
    }
  }

  /**
   * Create provider (admin only)
   * POST /api/llm/providers
   */
  static async createProvider(req: Request, res: Response) {
    try {
      const provider = await LLMProvidersService.createProvider(req.body);
      return ApiResponse.success(res, provider, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to create provider");
    }
  }

  /**
   * Update provider (admin only)
   * PUT /api/llm/providers/:id
   */
  static async updateProvider(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid provider ID" }, "Invalid provider ID");
      }

      const provider = await LLMProvidersService.updateProvider(id, req.body);
      return ApiResponse.success(res, provider);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to update provider");
    }
  }

  /**
   * Delete provider (admin only)
   * DELETE /api/llm/providers/:id
   */
  static async deleteProvider(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid provider ID" }, "Invalid provider ID");
      }

      await LLMProvidersService.deleteProvider(id);
      return ApiResponse.success(res, { success: true });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to delete provider");
    }
  }

  /**
   * Set provider API key (admin only)
   * POST /api/llm/providers/:id/api-key
   */
  static async setApiKey(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid provider ID" }, "Invalid provider ID");
      }

      const { apiKey } = req.body;
      if (!apiKey) {
        return ApiResponse.validationError(res, { apiKey: "API key is required" }, "API key is required");
      }

      await LLMProvidersService.setProviderApiKey(id, apiKey);
      return ApiResponse.success(res, { success: true });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to set API key");
    }
  }

  /**
   * Get effective settings (authenticated users)
   * GET /api/llm/settings?providerId=1
   */
  static async getEffectiveSettings(req: Request, res: Response) {
    try {
      const providerId = req.query.providerId 
        ? parseInt(req.query.providerId as string)
        : undefined;

      if (providerId && isNaN(providerId)) {
        return ApiResponse.validationError(res, { providerId: "Invalid provider ID" }, "Invalid provider ID");
      }

      if (!providerId) {
        // Return all global settings
        const settings = await LLMSettingsService.getGlobalSettings();
        // Enrich with provider info
        const enrichedSettings = await Promise.all(
          settings.map(async (setting) => {
            try {
              const provider = await LLMProvidersService.getProvider(setting.providerId);
              return {
                ...setting,
                provider,
                isOverridden: false, // Always false in MVP
              };
            } catch {
              return {
                ...setting,
                provider: null,
                isOverridden: false,
              };
            }
          })
        );
        return ApiResponse.success(res, enrichedSettings);
      }

      // Get effective settings for specific provider
      const settings = await LLMSettingsService.getEffectiveSettings(providerId);
      const provider = await LLMProvidersService.getProvider(providerId);
      
      // Always return as array for consistency
      return ApiResponse.success(res, [{
        ...settings,
        provider,
        isOverridden: false, // Always false in MVP
      }]);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to fetch effective settings");
    }
  }

  /**
   * Get global settings (admin only)
   * GET /api/llm/settings/global?providerId=1
   */
  static async getGlobalSettings(req: Request, res: Response) {
    try {
      const providerId = req.query.providerId 
        ? parseInt(req.query.providerId as string)
        : undefined;

      if (providerId && isNaN(providerId)) {
        return ApiResponse.validationError(res, { providerId: "Invalid provider ID" }, "Invalid provider ID");
      }

      const settings = await LLMSettingsService.getGlobalSettings(providerId);
      return ApiResponse.success(res, settings);
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to fetch global settings");
    }
  }

  /**
   * Create or update global settings (admin only)
   * POST /api/llm/settings/global
   */
  static async createGlobalSettings(req: Request, res: Response) {
    try {
      const { providerId, ...settingsData } = req.body;

      if (!providerId || isNaN(parseInt(providerId))) {
        return ApiResponse.validationError(res, { providerId: "Valid provider ID is required" }, "Valid provider ID is required");
      }

      const settings = await LLMSettingsService.createOrUpdateGlobalSettings(
        parseInt(providerId),
        settingsData
      );
      return ApiResponse.success(res, settings, 201);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, { error: error.message }, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to create/update global settings");
    }
  }

  /**
   * Update settings (admin only)
   * PUT /api/llm/settings/:id
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid settings ID" }, "Invalid settings ID");
      }

      const settings = await LLMSettingsService.updateSettings(id, req.body);
      return ApiResponse.success(res, settings);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to update settings");
    }
  }

  /**
   * Delete settings (admin only)
   * DELETE /api/llm/settings/:id
   */
  static async deleteSettings(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ApiResponse.validationError(res, { id: "Invalid settings ID" }, "Invalid settings ID");
      }

      await LLMSettingsService.deleteSettings(id);
      return ApiResponse.success(res, { success: true });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to delete settings");
    }
  }
}

