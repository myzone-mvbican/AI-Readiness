import { db } from "../db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { llmProviders } from "@shared/schema";
import { BaseRepository } from "./base.repository";
import type { Transaction } from "drizzle-orm";

export interface LLMProvider {
  id: number;
  name: string;
  displayName: string;
  description?: string | null;
  apiKeyEncrypted?: string | null;
  apiBaseUrl?: string | null;
  availableModels: string[];
  defaultModel?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertLLMProvider {
  name: string;
  displayName: string;
  description?: string;
  apiKeyEncrypted?: string;
  apiBaseUrl?: string;
  availableModels: string[];
  defaultModel?: string;
  isActive?: boolean;
}

export interface UpdateLLMProvider {
  displayName?: string;
  description?: string;
  apiKeyEncrypted?: string;
  apiBaseUrl?: string;
  availableModels?: string[];
  defaultModel?: string;
  isActive?: boolean;
}

export class LLMProvidersRepository implements BaseRepository<LLMProvider> {
  constructor(private drizzleDb = db) {}

  /**
   * Create a new LLM provider
   */
  async create(data: InsertLLMProvider, tx?: Transaction): Promise<LLMProvider> {
    const db = tx || this.drizzleDb;
    const [provider] = await db
      .insert(llmProviders)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    return provider;
  }

  /**
   * Get provider by ID
   */
  async getById(id: number, tx?: Transaction): Promise<LLMProvider | null> {
    const db = tx || this.drizzleDb;
    const [provider] = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.id, id))
      .limit(1);
    return provider || null;
  }

  /**
   * Get provider by name (e.g., "openai", "anthropic")
   */
  async getByName(name: string, tx?: Transaction): Promise<LLMProvider | null> {
    const db = tx || this.drizzleDb;
    const [provider] = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.name, name))
      .limit(1);
    return provider || null;
  }

  /**
   * Get all providers
   */
  async getAll(filters?: any, tx?: Transaction): Promise<LLMProvider[]> {
    const db = tx || this.drizzleDb;
    let query = db.select().from(llmProviders);
    
    // Apply filters if provided
    if (filters?.isActive !== undefined) {
      query = query.where(eq(llmProviders.isActive, filters.isActive)) as any;
    }
    
    const providers = await query.orderBy(desc(llmProviders.createdAt));
    return providers;
  }

  /**
   * Get all active providers
   */
  async getActive(tx?: Transaction): Promise<LLMProvider[]> {
    return this.getAll({ isActive: true }, tx);
  }

  /**
   * Update provider
   */
  async update(id: number, data: UpdateLLMProvider, tx?: Transaction): Promise<LLMProvider> {
    const db = tx || this.drizzleDb;
    const [updatedProvider] = await db
      .update(llmProviders)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(llmProviders.id, id))
      .returning();
    
    if (!updatedProvider) {
      throw new Error(`Provider with id ${id} not found`);
    }
    
    return updatedProvider;
  }

  /**
   * Delete provider (hard delete)
   */
  async delete(id: number, tx?: Transaction): Promise<boolean> {
    const db = tx || this.drizzleDb;
    const result = await db
      .delete(llmProviders)
      .where(eq(llmProviders.id, id));
    return result.rowCount > 0;
  }

  /**
   * Set encrypted API key for a provider
   */
  async setApiKey(providerId: number, encryptedApiKey: string, tx?: Transaction): Promise<LLMProvider> {
    return this.update(providerId, { apiKeyEncrypted: encryptedApiKey }, tx);
  }

  /**
   * Get encrypted API key (for internal use only - never return to frontend)
   */
  async getApiKey(providerId: number, tx?: Transaction): Promise<string | null> {
    const provider = await this.getById(providerId, tx);
    return provider?.apiKeyEncrypted || null;
  }
}

