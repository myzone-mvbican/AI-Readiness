// server/utils/envValidation.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("5000"),

  // Frontend
  FRONTEND_URL: z.string().url().default("http://localhost:5000"),
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Redis
  REDIS_URL: z.string().url().optional(),

  // Secrets
  JWT_SECRET: z.string().min(22, "JWT_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(22, "REFRESH_TOKEN_SECRET must be at least 32 characters").optional(),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  // Security
  ARGON2_MEMORY_COST: z.string().transform(Number).default("65536"), // 64 MB
  ARGON2_TIME_COST: z.string().transform(Number).default("3"),
  ARGON2_PARALLELISM: z.string().transform(Number).default("1"),

  // PII Encryption
  PII_ENCRYPTION_KEY: z.string().min(32, "PII_ENCRYPTION_KEY must be at least 32 characters").optional(),

  // Email (optional) 
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_POOL: z.string().optional(),
  
  DKIM_DOMAIN: z.string().optional(),
  DKIM_SELECTOR: z.string().optional(),
  DKIM_PRIVATE_KEY: z.string().optional(),

  MAIL_FROM: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),

  // Request Size Limits
  REQUEST_SIZE_LIMIT_GENERAL: z.string().default("1mb"),
  REQUEST_SIZE_LIMIT_AUTH: z.string().default("500kb"),
  REQUEST_SIZE_LIMIT_UPLOAD: z.string().default("10mb"),
  REQUEST_SIZE_LIMIT_AI: z.string().default("5mb"),
  REQUEST_SIZE_LIMIT_SURVEY: z.string().default("2mb"),
  REQUEST_SIZE_LIMIT_ADMIN: z.string().default("1mb"),
  REQUEST_SIZE_LIMIT_DEFAULT: z.string().default("1mb"),

  // Account Lockout
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default("5"),
  LOCKOUT_DURATION_MINUTES: z.string().transform(Number).default("30"),

  // Password History
  PASSWORD_HISTORY_LIMIT: z.string().transform(Number).default("12"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4o"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  
  // Microsoft OAuth
  MICROSOFT_CLIENT_ID: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err =>
        `${err.path.join(".")}: ${err.message}`
      ).join("\n");

      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

// Export validated config
export const env = validateEnv();
