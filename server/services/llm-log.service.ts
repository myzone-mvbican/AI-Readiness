import { LLMLogRepository, LLMLogFilters, LLMLogPaginationOptions } from "../repositories/llm-log.repository";
import { InternalServerError } from "../utils/errors";

export interface CreateLLMLogData {
  userId?: number;
  organizationId?: number;
  environment: string;
  route?: string;
  featureName: string;
  provider: string;
  model: string;
  endpoint?: string;
  request: any;
  response?: any;
  metrics?: any;
  retries?: number;
  security?: any;
  redactionStatus?: string;
  debug?: any;
  stableTrace?: any;
  timestamp?: Date;
}

export class LLMLogService {
  private static llmLogRepository = new LLMLogRepository();

  /**
   * Create a new LLM log entry
   */
  static async createLog(data: CreateLLMLogData): Promise<number> {
    try {
      // Denormalize fields from request for filtering
      const logData = {
        schemaVersion: 1,
        userId: data.userId || null,
        organizationId: data.organizationId || null,
        timestamp: data.timestamp || new Date(),
        environment: data.environment,
        route: data.route || null,
        featureName: data.featureName,
        provider: data.provider,
        model: data.model,
        endpoint: data.endpoint || null,
        request: data.request,
        temperature: data.request?.temperature || null,
        maxTokens: data.request?.maxTokens || null,
        response: data.response || null,
        metrics: data.metrics || null,
        retries: data.retries || 0,
        security: data.security || null,
        redactionStatus: data.redactionStatus || "pending",
        debug: data.debug || null,
        stableTrace: data.stableTrace || null,
      };

      const log = await this.llmLogRepository.create(logData);
      return log.id;
    } catch (error: any) {
      throw new InternalServerError("Failed to create LLM log entry");
    }
  }

  /**
   * Get logs with pagination and filters
   */
  static async getLogs(options: LLMLogPaginationOptions) {
    try {
      return await this.llmLogRepository.getPaginated(options);
    } catch (error: any) {
      throw new InternalServerError("Failed to retrieve LLM logs");
    }
  }

  /**
   * Get a single log by ID
   */
  static async getLogById(id: number) {
    try {
      const log = await this.llmLogRepository.getById(id);
      if (!log) {
        return null;
      }
      return log;
    } catch (error: any) {
      throw new InternalServerError("Failed to retrieve LLM log");
    }
  }

  /**
   * Soft delete a log entry
   */
  static async softDelete(id: number): Promise<void> {
    try {
      const deleted = await this.llmLogRepository.delete(id);
      if (!deleted) {
        throw new InternalServerError("Failed to delete LLM log");
      }
    } catch (error: any) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError("Failed to delete LLM log");
    }
  }
}

