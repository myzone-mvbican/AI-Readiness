import { db } from "../db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { llmSettings } from "@shared/schema";
import { BaseRepository } from "./base.repository";
import type { Transaction } from "drizzle-orm";

export interface LLMSettings {
  id: number;
  organizationId: number | null; // null = global settings (always null in MVP)
  providerId: number;
  preferredModel?: string | null;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxRetries: number;
  retryBackoffMs: number;
  requestTimeoutMs: number;
  enableLogging: boolean;
  logLevel: string;
  logRequestData: boolean;
  logResponseData: boolean;
  customSettings?: any | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertLLMSettings {
  organizationId?: number | null; // Should be null in MVP
  providerId: number;
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
  requestTimeoutMs?: number;
  enableLogging?: boolean;
  logLevel?: string;
  logRequestData?: boolean;
  logResponseData?: boolean;
  customSettings?: any;
  isActive?: boolean;
}

export interface UpdateLLMSettings {
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
  requestTimeoutMs?: number;
  enableLogging?: boolean;
  logLevel?: string;
  logRequestData?: boolean;
  logResponseData?: boolean;
  customSettings?: any;
  isActive?: boolean;
}

export class LLMSettingsRepository implements BaseRepository<LLMSettings> {
  constructor(private drizzleDb = db) {}

  /**
   * Create new settings entry
   */
  async create(data: InsertLLMSettings, tx?: Transaction): Promise<LLMSettings> {
    const db = tx || this.drizzleDb;
    const [settings] = await db
      .insert(llmSettings)
      .values({
        ...data,
        organizationId: data.organizationId ?? null, // Ensure null for MVP
        updatedAt: new Date(),
      })
      .returning();
    return settings;
  }

  /**
   * Get settings by ID
   */
  async getById(id: number, tx?: Transaction): Promise<LLMSettings | null> {
    const db = tx || this.drizzleDb;
    const [setting] = await db
      .select()
      .from(llmSettings)
      .where(eq(llmSettings.id, id))
      .limit(1);
    return setting || null;
  }

  /**
   * Update settings
   */
  async update(id: number, data: UpdateLLMSettings, tx?: Transaction): Promise<LLMSettings> {
    const db = tx || this.drizzleDb;
    const [updatedSettings] = await db
      .update(llmSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(llmSettings.id, id))
      .returning();
    
    if (!updatedSettings) {
      throw new Error(`Settings with id ${id} not found`);
    }
    
    return updatedSettings;
  }

  /**
   * Delete settings
   */
  async delete(id: number, tx?: Transaction): Promise<boolean> {
    const db = tx || this.drizzleDb;
    const result = await db
      .delete(llmSettings)
      .where(eq(llmSettings.id, id));
    return result.rowCount > 0;
  }

  /**
   * Get all settings (with optional filters)
   */
  async getAll(filters?: any, tx?: Transaction): Promise<LLMSettings[]> {
    const db = tx || this.drizzleDb;
    let query = db.select().from(llmSettings);
    
    const conditions: any[] = [];
    
    // MVP: Only global settings (organizationId is NULL)
    conditions.push(isNull(llmSettings.organizationId));
    
    // Apply additional filters
    if (filters?.providerId) {
      conditions.push(eq(llmSettings.providerId, filters.providerId));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(llmSettings.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const settings = await query.orderBy(desc(llmSettings.createdAt));
    return settings;
  }

  /**
   * Get global settings (organizationId = NULL)
   * MVP: This is the only type of settings available
   */
  async getGlobalSettings(providerId?: number, tx?: Transaction): Promise<LLMSettings[]> {
    const filters: any = {};
    if (providerId) {
      filters.providerId = providerId;
    }
    return this.getAll(filters, tx);
  }

  /**
   * Get settings for a specific provider
   * MVP: Returns global settings only (organizationId is NULL)
   */
  async getByProvider(providerId: number, tx?: Transaction): Promise<LLMSettings | null> {
    const settings = await this.getGlobalSettings(providerId, tx);
    // Return the first active setting, or first setting if none are active
    const activeSetting = settings.find(s => s.isActive);
    return activeSetting || settings[0] || null;
  }

  /**
   * Create or update global settings for a provider
   * MVP: organizationId is always NULL
   */
  async createOrUpdateGlobalSettings(
    providerId: number,
    data: InsertLLMSettings,
    tx?: Transaction
  ): Promise<LLMSettings> {
    const db = tx || this.drizzleDb;
    
    // Check if settings already exist for this provider
    const existing = await this.getByProvider(providerId, tx);
    
    if (existing) {
      // Update existing settings
      return this.update(existing.id, data, tx);
    } else {
      // Create new settings
      return this.create({
        ...data,
        providerId,
        organizationId: null, // Always null in MVP
      }, tx);
    }
  }
}

