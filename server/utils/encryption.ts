/**
 * Encryption utilities for LLM API keys
 * Uses AES-256-GCM encryption for secure storage
 */

import crypto from 'crypto';
import { env } from './environment';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = env.LLM_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('LLM_ENCRYPTION_KEY environment variable is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  // Key should be a hex string (64 characters for 32 bytes)
  if (key.length !== 64) {
    throw new Error('LLM_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  
  try {
    return Buffer.from(key, 'hex');
  } catch (error) {
    throw new Error('LLM_ENCRYPTION_KEY must be a valid hex string');
  }
}

/**
 * Encrypt an API key using AES-256-GCM
 * Returns a string in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encryptedData (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an API key using AES-256-GCM
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim().length === 0) {
    throw new Error('Encrypted data cannot be empty');
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected format: iv:authTag:encryptedData');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    if (error.message.includes('Unsupported state')) {
      throw new Error('Failed to decrypt API key. The encryption key may have changed or the data is corrupted.');
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Mask an API key for display purposes
 * Shows first 7 characters and masks the rest
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length === 0) {
    return '****';
  }
  
  if (apiKey.length <= 8) {
    return '****';
  }
  
  return `${apiKey.slice(0, 7)}...****`;
}

/**
 * Validate API key format (basic validation)
 * Different providers have different formats, so this is a basic check
 */
export function validateApiKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length < 10) {
    return false;
  }
  
  // Basic format validation per provider
  const providerFormats: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{32,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{32,}$/,
    google: /^[a-zA-Z0-9_-]{32,}$/,
    cohere: /^[a-zA-Z0-9]{32,}$/,
    mistral: /^[a-zA-Z0-9]{32,}$/,
  };
  
  const format = providerFormats[provider.toLowerCase()];
  if (format) {
    return format.test(apiKey);
  }
  
  // Default: at least 10 characters
  return apiKey.length >= 10;
}

