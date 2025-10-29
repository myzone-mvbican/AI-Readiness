import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { env } from "server/utils/environment";
import { RedisCache } from "server/cache";

/**
 * Token Management Service
 * Implements dual-token system with access tokens (15min) and refresh tokens (7 days)
 * Uses HttpOnly cookies for secure token storage
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: number;
  role: string;
  sessionId: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenId: string; // Unique identifier for refresh token rotation
}

export class TokenService {
  // Separate secrets for access and refresh tokens (32+ characters each)
  private static readonly ACCESS_TOKEN_SECRET = env.JWT_SECRET || env.JWT_SECRET + '_access';
  private static readonly REFRESH_TOKEN_SECRET = env.JWT_SECRET || env.JWT_SECRET + '_refresh';
  
  // Token expiry times
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  
  // Cookie names
  private static readonly ACCESS_TOKEN_COOKIE = 'access_token';
  private static readonly REFRESH_TOKEN_COOKIE = 'refresh_token';
  
  // Redis storage for refresh tokens with 7-day TTL
  private static readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Generate token pair (access + refresh)
   */
  static async generateTokenPair(
    userId: number, 
    role: string, 
    sessionId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    // Generate unique refresh token ID
    const refreshTokenId = randomUUID();
    
    // Create access token payload
    const accessPayload: TokenPayload = {
      userId,
      role,
      sessionId
    };
    
    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      userId,
      role,
      sessionId,
      tokenId: refreshTokenId
    };
    
    // Generate tokens
    const accessToken = jwt.sign(accessPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
    
    const refreshToken = jwt.sign(refreshPayload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });
    
    // Store refresh token metadata in Redis
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const tokenData = {
      userId,
      role,
      sessionId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      userAgent,
      ipAddress
    };
    
    await RedisCache.setWithNamespace('token', refreshTokenId, JSON.stringify(tokenData), this.REFRESH_TOKEN_TTL);
    
    return { accessToken, refreshToken };
  }

  /**
   * Set tokens in HttpOnly cookies
   */
  static setTokenCookies(res: Response, tokens: TokenPair): void {
    const isProduction = env.NODE_ENV === 'production';
    
    // Set access token cookie (15 minutes)
    res.cookie(this.ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'strict' : 'lax', // More permissive in development
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: isProduction ? undefined : undefined // No domain restriction in development
    });
    
    // Set refresh token cookie (7 days)
    res.cookie(this.REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'strict' : 'lax', // More permissive in development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: isProduction ? undefined : undefined // No domain restriction in development
    });
  }

  /**
   * Clear token cookies
   */
  static clearTokenCookies(res: Response): void {
    res.clearCookie(this.ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(this.REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token and get metadata
   */
  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
      
      // Check if refresh token exists in Redis and is not expired
      const tokenDataStr = await RedisCache.getWithNamespace('token', decoded.tokenId);
      if (!tokenDataStr) {
        return null; // Token not found in Redis
      }
      
      const tokenData = JSON.parse(tokenDataStr);
      const expiresAt = new Date(tokenData.expiresAt);
      
      if (expiresAt < new Date()) {
        // Token expired, clean up from Redis
        await RedisCache.delWithNamespace('token', decoded.tokenId);
        return null;
      }
      
      // Update last used timestamp
      tokenData.lastUsed = new Date().toISOString();
      await RedisCache.setWithNamespace('token', decoded.tokenId, JSON.stringify(tokenData), this.REFRESH_TOKEN_TTL);
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const decoded = await this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }
    
    // Generate new access token
    const accessPayload: TokenPayload = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId
    };
    
    return jwt.sign(accessPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * Rotate refresh token (revoke old, create new)
   */
  static async rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair | null> {
    const decoded = await this.verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      return null;
    }
    
    // Revoke old refresh token
    await this.revokeRefreshToken(decoded.tokenId);
    
    // Generate new token pair
    return await this.generateTokenPair(
      decoded.userId,
      decoded.role,
      decoded.sessionId
    );
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(tokenId: string): Promise<void> {
    await RedisCache.delWithNamespace('token', tokenId);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: number): Promise<void> {
    // Note: This is a simplified implementation. In a production environment,
    // you might want to maintain a secondary index of user -> tokenIds
    // For now, we'll rely on Redis TTL to clean up expired tokens
    // and individual token revocation for active sessions
    const redis = RedisCache.getClient();
    const pattern = 'token:*';
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const tokenDataStr = await redis.get(key);
      if (tokenDataStr) {
        const tokenData = JSON.parse(tokenDataStr);
        if (tokenData.userId === userId) {
          await redis.del(key);
        }
      }
    }
  }

  /**
   * Get user's active sessions
   */
  static async getUserSessions(userId: number): Promise<Array<{
    sessionId: string;
    createdAt: Date;
    lastUsed: Date;
    userAgent?: string;
    ipAddress?: string;
  }>> {
    const sessions: Array<{
      sessionId: string;
      createdAt: Date;
      lastUsed: Date;
      userAgent?: string;
      ipAddress?: string;
    }> = [];
    
    const redis = RedisCache.getClient();
    const pattern = 'token:*';
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const tokenDataStr = await redis.get(key);
      if (tokenDataStr) {
        const tokenData = JSON.parse(tokenDataStr);
        const expiresAt = new Date(tokenData.expiresAt);
        
        if (tokenData.userId === userId && expiresAt > new Date()) {
          sessions.push({
            sessionId: tokenData.sessionId,
            createdAt: new Date(tokenData.createdAt),
            lastUsed: new Date(tokenData.lastUsed),
            userAgent: tokenData.userAgent,
            ipAddress: tokenData.ipAddress
          });
        }
      }
    }
    
    return sessions;
  }

  /**
   * Get token from request cookies
   */
  static getTokenFromRequest(req: Request, tokenType: 'access' | 'refresh'): string | null {
    const cookieName = tokenType === 'access' ? this.ACCESS_TOKEN_COOKIE : this.REFRESH_TOKEN_COOKIE;
    return req.cookies?.[cookieName] || null;
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return randomUUID();
  }
}
