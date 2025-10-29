import argon2 from 'argon2';
import { z } from 'zod';

/**
 * Password Security Service
 * Implements Argon2id hashing, complexity validation, and password history tracking
 */

// Password complexity validation schema
export const passwordComplexitySchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be no more than 128 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i,
      /master/i
    ];
    return !commonPatterns.some(pattern => pattern.test(password));
  }, 'Password contains common patterns and is not secure');

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordHistoryEntry {
  passwordHash: string;
  createdAt: Date;
}

export class PasswordSecurityService {
  // Argon2id configuration for production security
  private static readonly ARGON2_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 1, // 1 thread
    hashLength: 32, // 32 bytes
  };

  /**
   * Validate password complexity and strength
   */
  static validatePasswordComplexity(password: string): PasswordValidationResult {
    try {
      passwordComplexitySchema.parse(password);
      
      // Calculate password strength
      let strength: 'weak' | 'medium' | 'strong' = 'weak';
      let score = 0;
      
      // Length scoring
      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      if (password.length >= 16) score += 1;
      
      // Character variety scoring
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;
      
      // Determine strength
      if (score >= 6) strength = 'strong';
      else if (score >= 4) strength = 'medium';
      
      return {
        isValid: true,
        errors: [],
        strength
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => err.message),
          strength: 'weak'
        };
      }
      return {
        isValid: false,
        errors: ['Password validation failed'],
        strength: 'weak'
      };
    }
  }

  /**
   * Hash password using Argon2id
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, this.ARGON2_CONFIG);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Check if password is in history (prevent reuse of last 12 passwords)
   */
  static async isPasswordInHistory(
    password: string, 
    passwordHistory: PasswordHistoryEntry[]
  ): Promise<boolean> {
    for (const entry of passwordHistory) {
      const isMatch = await this.verifyPassword(password, entry.passwordHash);
      if (isMatch) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add password to history (keep last 12)
   */
  static async addPasswordToHistory(
    passwordHash: string,
    passwordHistory: PasswordHistoryEntry[]
  ): Promise<PasswordHistoryEntry[]> {
    // Add new password to history
    const newHistory = [
      { passwordHash, createdAt: new Date() },
      ...passwordHistory
    ];
    
    // Keep only last 12 passwords
    return newHistory.slice(0, 12);
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining length with random characters
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs to be updated (older than 90 days)
   */
  static shouldUpdatePassword(lastPasswordChange: Date): boolean {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return lastPasswordChange < ninetyDaysAgo;
  }

  /**
   * Get password strength meter data for frontend
   */
  static getPasswordStrengthMeter(password: string): {
    score: number;
    feedback: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const validation = this.validatePasswordComplexity(password);
    
    let score = 0;
    const feedback: string[] = [];
    
    // Length feedback
    if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }
    
    // Character variety feedback
    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letters');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters');
    } else {
      score += 1;
    }
    
    if (!/[0-9]/.test(password)) {
      feedback.push('Add numbers');
    } else {
      score += 1;
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Add special characters');
    } else {
      score += 1;
    }
    
    // Common pattern check
    const commonPatterns = [
      /123456/, /password/i, /qwerty/i, /abc123/i,
      /admin/i, /letmein/i, /welcome/i, /monkey/i
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Avoid common patterns');
    } else {
      score += 1;
    }
    
    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 6) strength = 'strong';
    else if (score >= 4) strength = 'medium';
    
    return {
      score: Math.min(score, 8),
      feedback: feedback.length > 0 ? feedback : ['Strong password!'],
      strength
    };
  }
}
