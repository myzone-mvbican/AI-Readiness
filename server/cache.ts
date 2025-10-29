// server/services/redis.service.ts
import Redis from "ioredis";
import { env } from "server/utils/environment";
import { log } from "server/vite";

/**
 * Redis Service - Centralized Redis client management using ioredis
 * 
 * Provides:
 * - Single Redis client instance (singleton pattern)
 * - Application-level connection management
 * - Environment-aware error handling
 * - Graceful shutdown support
 * - Comprehensive logging and monitoring
 */
export class RedisCache {
  private static client: Redis | null = null;
  private static isConnecting = false;

  /**
   * Get Redis client instance (singleton)
   * Creates connection if not already established
   */
  static getClient(): Redis {
    if (!this.client && !this.isConnecting) {
      this.client = this.createClient();
    }
    return this.client!;
  }

  /**
   * Create Redis client with application-level configuration
   */
  private static createClient(): Redis {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required for Redis operations");
    }

    // Debug logging for Redis connection
    const redisUrl = env.REDIS_URL;
    const redisHost = redisUrl.match(/@([^:/]+)/)?.[1] || redisUrl.match(/:\/\/([^:/]+)/)?.[1] || 'localhost';
    const redisPort = redisUrl.match(/:(\d+)\//)?.[1] || redisUrl.match(/:(\d+)$/)?.[1] || '6379';
    const isLocalRedis = redisHost.includes('localhost') || redisHost.includes('127.0.0.1');

    log('='.repeat(60));
    log('🔴 REDIS CONNECTION INFO:');
    log('='.repeat(60));
    log(`📍 Environment: ${isLocalRedis ? 'LOCAL' : 'REMOTE'}`);
    log(`🌐 Host: ${redisHost}`);
    log(`🔢 Port: ${redisPort}`);
    log(`🔗 Connection String: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
    log(`🧰 Driver: ioredis`);
    log('='.repeat(60));

    const client = new Redis(env.REDIS_URL, {
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });

    // Handle Redis connection events
    client.on("error", (err) => {
      log(`❌ Redis connection error: ${err.message}`);
    });

    client.on("connect", () => {
      log("✅ Redis connected successfully");
    });

    client.on("ready", () => {
      log("🚀 Redis ready for operations");
    });

    client.on("reconnecting", () => {
      log("🔄 Redis reconnecting...");
    });

    client.on("close", () => {
      log("🔌 Redis connection closed");
    });

    client.on("end", () => {
      log("🔚 Redis connection ended");
    });

    // Connect to Redis
    this.isConnecting = true;
    client.connect().catch((err) => {
      log(`❌ Redis connection failed: ${err.message}`);
      this.isConnecting = false;
      throw err;
    }).then(() => {
      this.isConnecting = false;
    });

    return client;
  }

  /**
   * Check if Redis client is available and connected
   */
  static isAvailable(): boolean {
    return this.client?.status === 'ready';
  }

  /**
   * Gracefully close Redis connection
   * Should be called during application shutdown
   */
  static async close(): Promise<void> {
    if (!this.client) return;

    try {
      if (this.client.status === 'ready' || this.client.status === 'connecting') {
        await this.client.quit();
        log("✅ Redis connection closed gracefully");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log(`⚠️ Error closing Redis connection: ${errorMessage}`);
    } finally {
      this.client = null;
      this.isConnecting = false;
    }
  }

  /**
   * Helper methods for common Redis operations with namespacing
   */
  static async setWithNamespace(namespace: string, key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    const fullKey = `${namespace}:${key}`;
    
    if (ttl) {
      await client.setex(fullKey, ttl, value);
    } else {
      await client.set(fullKey, value);
    }
  }

  static async getWithNamespace(namespace: string, key: string): Promise<string | null> {
    const client = this.getClient();
    const fullKey = `${namespace}:${key}`;
    return await client.get(fullKey);
  }

  static async delWithNamespace(namespace: string, key: string): Promise<number> {
    const client = this.getClient();
    const fullKey = `${namespace}:${key}`;
    return await client.del(fullKey);
  }
}
