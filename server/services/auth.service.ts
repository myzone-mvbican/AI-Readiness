 import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { User, GoogleUserPayload } from "@shared/types";
import { InsertUser, UpdateUser } from "@shared/types/requests";
import { UserRepository } from "../repositories/user.repository";
import { TeamService } from "./team.service"; 
import { TeamRepository } from "../repositories/team.repository"; 
import { PasswordSecurityService } from "./password-security.service";
import { TokenService } from "./token.service";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  InternalServerError,
} from "../utils/errors";
import { env } from "server/utils/environment";

/**
 * AuthService - Business logic for authentication operations
 * Extracted from AuthController to follow service layer pattern
 */
export class AuthService {
  public userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Register a new user with business logic
   */
  async registerUser(userData: InsertUser): Promise<{ user: User }> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.getByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError("A user with this email already exists");
      }

      // Validate password complexity
      const passwordValidation = PasswordSecurityService.validatePasswordComplexity(userData.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash password with Argon2id
      const hashedPassword = await this.hashPassword(userData.password);
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase(),
        passwordStrength: passwordValidation.strength,
        lastPasswordChange: new Date(),
      };

      // Create user with default team assignment
      const isMyZoneEmail = userData.email.endsWith("@myzone.ai");
      const defaultTeamName = isMyZoneEmail ? "MyZone" : "Client";
      
      let defaultTeam = await TeamService.getByName(defaultTeamName);
      if (!defaultTeam) {
        // Create the default team if it doesn't exist
        try {
          defaultTeam = await TeamRepository.create({ name: defaultTeamName });
        } catch (error) {
          // If we can't create the team, try to get it again in case it was created by another request
          defaultTeam = await TeamService.getByName(defaultTeamName);
          if (!defaultTeam) {
            throw new InternalServerError(`Failed to create or find default team '${defaultTeamName}'`);
          }
        }
      }

      // Create user and assign to team in transaction
      const { user } = await this.userRepository.createWithDefaultTeam(
        userWithHashedPassword,
        defaultTeam.id,
        "client"
      );

      // Transfer guest assessments to new user
      try {
        await this.userRepository.transferGuestAssessmentsToUser(
          user.email,
          user.id
        );
      } catch (error) {
        // Don't fail registration if guest assessment transfer fails
      }

      // No need to generate JWT token - we use the new token system in the controller
      return { user };
    } catch (error) {
      if (error instanceof ConflictError || error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError("Registration failed due to an unexpected error");
    }
  }

  /**
   * Login user with email and password
   */
  async loginUser(email: string, password: string, userAgent?: string, ipAddress?: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      const user = await this.userRepository.getByEmail(email);
      if (!user) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const isPasswordValid = await this.validatePassword(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Generate session ID and token pair
      const sessionId = TokenService.generateSessionId();
      const tokens = await TokenService.generateTokenPair(
        user.id,
        user.role || "client",
        sessionId,
        userAgent,
        ipAddress
      );

      return { user, tokens };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError("Login failed due to an unexpected error");
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(credential: string, userAgent?: string, ipAddress?: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      // Verify Google token
      const googleUserData = await this.verifyGoogleToken(credential);
      if (!googleUserData) {
        throw new UnauthorizedError("Invalid Google token");
      }

      // Check if user exists with Google ID
      let user = await this.userRepository.getByGoogleId(googleUserData.sub);

      if (!user) {
        // Check if user exists with email
        user = await this.userRepository.getByEmail(googleUserData.email);

        if (!user) {
          // Create new user
          const randomPassword = this.generateRandomPassword();
          const userData: InsertUser = {
            name: googleUserData.name,
            email: googleUserData.email,
            password: randomPassword,
            googleId: googleUserData.sub,
          };

          // Create user with default team
          const isMyZoneEmail = googleUserData.email.endsWith("@myzone.ai");
          const defaultTeamName = isMyZoneEmail ? "MyZone" : "Client";
          
          let defaultTeam = await TeamService.getByName(defaultTeamName);
          if (!defaultTeam) {
            // Create the default team if it doesn't exist
            try {
              defaultTeam = await TeamRepository.create({ name: defaultTeamName });
            } catch (error) {
              // If we can't create the team, try to get it again in case it was created by another request
              defaultTeam = await TeamService.getByName(defaultTeamName);
              if (!defaultTeam) {
                throw new InternalServerError(`Failed to create or find default team '${defaultTeamName}'`);
              }
            }
          }

          const { user: newUser } = await this.userRepository.createWithDefaultTeam(
            userData,
            defaultTeam.id,
            "client"
          );

          // Transfer guest assessments
          try {
            await this.userRepository.transferGuestAssessmentsToUser(
              newUser.email,
              newUser.id
            );
          } catch (error) {
          }

          user = newUser;
        } else {
          // Connect Google ID to existing user
          user = await this.userRepository.connectGoogleAccount(
            user.id,
            googleUserData.sub
          );
        }
      }

      // Generate session ID and token pair
      const sessionId = TokenService.generateSessionId();
      const tokens = await TokenService.generateTokenPair(
        user.id,
        user.role || "client",
        sessionId,
        userAgent,
        ipAddress
      );

      return { user, tokens };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof InternalServerError) {
        throw error;
      }
      console.error("Google authentication error:", error);
      throw new InternalServerError("Google authentication failed due to an unexpected error");
    }
  }

  /**
   * Login with Microsoft OAuth
   */
  async loginWithMicrosoft(credential: string, userAgent?: string, ipAddress?: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      // Verify Microsoft token
      const microsoftUserData = await this.verifyMicrosoftToken(credential);
      if (!microsoftUserData) {
        throw new UnauthorizedError("Invalid Microsoft token");
      }

      // Check if user exists with Microsoft ID
      let user = await this.userRepository.getByMicrosoftId(microsoftUserData.sub);

      if (!user) {
        // Check if user exists with email
        user = await this.userRepository.getByEmail(microsoftUserData.email);

        if (!user) {
          // Create new user
          const randomPassword = this.generateRandomPassword();
          const userData: InsertUser = {
            name: microsoftUserData.name,
            email: microsoftUserData.email,
            password: randomPassword,
            microsoftId: microsoftUserData.sub,
          };

          // Create user with default team
          const isMyZoneEmail = microsoftUserData.email.endsWith("@myzone.ai");
          const defaultTeamName = isMyZoneEmail ? "MyZone" : "Client";
          
          let defaultTeam = await TeamService.getByName(defaultTeamName);
          if (!defaultTeam) {
            // Create the default team if it doesn't exist
            try {
              defaultTeam = await TeamRepository.create({ name: defaultTeamName });
            } catch (error) {
              // If we can't create the team, try to get it again in case it was created by another request
              defaultTeam = await TeamService.getByName(defaultTeamName);
              if (!defaultTeam) {
                throw new InternalServerError(`Failed to create or find default team '${defaultTeamName}'`);
              }
            }
          }

          const { user: newUser } = await this.userRepository.createWithDefaultTeam(
            userData,
            defaultTeam.id,
            "client"
          );

          // Transfer guest assessments
          try {
            await this.userRepository.transferGuestAssessmentsToUser(
              newUser.email,
              newUser.id
            );
          } catch (error) {
          }

          user = newUser;
        } else {
          // Connect Microsoft ID to existing user
          user = await this.userRepository.connectMicrosoftAccount(
            user.id,
            microsoftUserData.sub
          );
        }
      }

      // Generate session ID and token pair
      const sessionId = TokenService.generateSessionId();
      const tokens = await TokenService.generateTokenPair(
        user.id,
        user.role || "client",
        sessionId,
        userAgent,
        ipAddress
      );

      return { user, tokens };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof InternalServerError) {
        throw error;
      }
      console.error("Microsoft authentication error:", error);
      throw new InternalServerError("Microsoft authentication failed due to an unexpected error");
    }
  }

  /**
   * Connect Google account to existing user
   */
  async connectGoogle(userId: number, credential: string): Promise<User> {
    try {
      // Verify Google token
      const googleUserData = await this.verifyGoogleToken(credential);
      if (!googleUserData) {
        throw new UnauthorizedError("Invalid Google token");
      }

      // Check if Google account is already connected to another user
      const existingUser = await this.userRepository.getByGoogleId(googleUserData.sub);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("This Google account is already connected to another user");
      }

      // Connect Google account
      const updatedUser = await this.userRepository.connectGoogleAccount(
        userId,
        googleUserData.sub
      );

      return updatedUser;
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ConflictError) {
        throw error;
      }
      console.error("Google connect error:", error);
      throw new InternalServerError("Failed to connect Google account");
    }
  }

  /**
   * Disconnect Google account from user
   */
  async disconnectGoogle(userId: number): Promise<User> {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      if (!user.googleId) {
        throw new ValidationError("No Google account is connected to this user");
      }

      // Ensure user has a password before disconnecting Google
      if (!user.password) {
        throw new ValidationError("Cannot disconnect Google account without a password set");
      }

      const updatedUser = await this.userRepository.disconnectGoogleAccount(userId);
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error("Google disconnect error:", error);
      throw new InternalServerError("Failed to disconnect Google account");
    }
  }

  /**
   * Connect Microsoft account to existing user
   */
  async connectMicrosoft(userId: number, credential: string): Promise<User> {
    try {
      // Verify Microsoft token
      const microsoftUserData = await this.verifyMicrosoftToken(credential);
      if (!microsoftUserData) {
        throw new UnauthorizedError("Invalid Microsoft token");
      }

      // Check if Microsoft account is already connected to another user
      const existingUser = await this.userRepository.getByMicrosoftId(microsoftUserData.sub);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("This Microsoft account is already connected to another user");
      }

      // Connect Microsoft account
      const updatedUser = await this.userRepository.connectMicrosoftAccount(
        userId,
        microsoftUserData.sub
      );

      return updatedUser;
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ConflictError) {
        throw error;
      }
      console.error("Microsoft connect error:", error);
      throw new InternalServerError("Failed to connect Microsoft account");
    }
  }

  /**
   * Disconnect Microsoft account from user
   */
  async disconnectMicrosoft(userId: number): Promise<User> {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      if (!user.microsoftId) {
        throw new ValidationError("No Microsoft account is connected to this user");
      }

      // Ensure user has a password before disconnecting Microsoft
      if (!user.password) {
        throw new ValidationError("Cannot disconnect Microsoft account without a password set");
      }

      const updatedUser = await this.userRepository.disconnectMicrosoftAccount(userId);
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error("Microsoft disconnect error:", error);
      throw new InternalServerError("Failed to disconnect Microsoft account");
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, profileData: UpdateUser): Promise<User> {
    try {
      const existingUser = await this.userRepository.getById(userId);
      if (!existingUser) {
        throw new NotFoundError("User");
      }

      // If updating password, validate current password and check history
      if (profileData.password && profileData.currentPassword) {
        const isCurrentPasswordValid = await this.validatePassword(
          profileData.currentPassword,
          existingUser.password
        );

        if (!isCurrentPasswordValid) {
          throw new UnauthorizedError("Current password is incorrect");
        }

        // Validate new password complexity
        const passwordValidation = PasswordSecurityService.validatePasswordComplexity(profileData.password);
        if (!passwordValidation.isValid) {
          throw new ValidationError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
        }

        // Check if password is in history
        const passwordHistory = existingUser.passwordHistory ? JSON.parse(existingUser.passwordHistory) : [];
        const isInHistory = await PasswordSecurityService.isPasswordInHistory(profileData.password, passwordHistory);
        if (isInHistory) {
          throw new ValidationError("Cannot reuse a recent password. Please choose a different password.");
        }

        // Hash new password and update history
        const newPasswordHash = await this.hashPassword(profileData.password);
        const updatedHistory = await PasswordSecurityService.addPasswordToHistory(newPasswordHash, passwordHistory);
        
        profileData.password = newPasswordHash;
        profileData.passwordStrength = passwordValidation.strength;
        profileData.lastPasswordChange = new Date();
        profileData.passwordHistory = JSON.stringify(updatedHistory);
      }

      // Remove currentPassword from update data
      const { currentPassword, ...updateData } = profileData;

      const updatedUser = await this.userRepository.update(userId, updateData);
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      console.error("Profile update error:", error);
      throw new InternalServerError("Failed to update profile");
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.getByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      await this.userRepository.setResetToken(user.id, token, expiry);

      // Send password reset email
      try {
        const { EmailService } = await import("./email.service");
        const emailSent = await EmailService.sendPasswordResetEmail(email, token, user.name);
        if (!emailSent) {
          console.error("Failed to send password reset email to:", email);
        } else {
        }
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Don't throw error here to avoid revealing user existence
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      throw new InternalServerError("Failed to process password reset request");
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.getByResetToken(token);
      if (!user) {
        throw new ValidationError("Invalid or expired reset token");
      }

      // Validate password complexity
      const complexityResult = PasswordSecurityService.validatePasswordComplexity(newPassword);
      if (!complexityResult.isValid) {
        throw new ValidationError(`Password does not meet requirements: ${complexityResult.errors.join(', ')}`);
      }

      // Parse password history
      let passwordHistory: import('./password-security.service').PasswordHistoryEntry[] = [];
      try {
        passwordHistory = JSON.parse(user.passwordHistory || '[]');
      } catch (error) {
        console.warn('Failed to parse password history, starting fresh');
        passwordHistory = [];
      }

      // Check password history
      const isInHistory = await PasswordSecurityService.isPasswordInHistory(newPassword, passwordHistory);
      if (isInHistory) {
        throw new ValidationError("You cannot reuse a previous password. Please choose a different password.");
      }

      // Hash new password with Argon2id
      const hashedPassword = await this.hashPassword(newPassword);

      // Get password strength
      const strengthData = PasswordSecurityService.getPasswordStrengthMeter(newPassword);

      // Update password history
      const updatedHistory = await PasswordSecurityService.addPasswordToHistory(hashedPassword, passwordHistory);

      // Update password and clear reset token
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        passwordStrength: strengthData.strength,
        lastPasswordChange: new Date(),
        passwordHistory: JSON.stringify(updatedHistory),
        resetToken: null,
        resetTokenExpiry: null,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Password reset confirmation error:", error);
      throw new InternalServerError("Failed to reset password");
    }
  }

  /**
   * Validate reset token
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const user = await this.userRepository.getByResetToken(token);
      return !!user;
    } catch (error) {
      console.error("Reset token validation error:", error);
      return false;
    }
  }

  /**
   * Verify Google token
   */
  private async verifyGoogleToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      const googleClientId = env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error("Google Client ID not configured");
        return null;
      }

      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }

      return {
        sub: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        email_verified: payload.email_verified || false,
      } as GoogleUserPayload;
    } catch (error) {
      console.error("Error verifying Google token:", error);
      return null;
    }
  }

  /**
   * Verify Microsoft token using OIDC/JWKS
   */
  private async verifyMicrosoftToken(token: string): Promise<GoogleUserPayload | null> {
    try {
      const microsoftClientId = env.MICROSOFT_CLIENT_ID;
      if (!microsoftClientId) {
        console.error("Microsoft Client ID not configured");
        return null;
      }

      // Decode token without verification to extract issuer
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Invalid JWT format");
        return null;
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      const issuer = payload.iss;
      
      if (!issuer) {
        console.error("No issuer found in token");
        return null;
      }

      // Fetch OIDC metadata to get the correct JWKS URI
      const metadataUrl = `${issuer}/.well-known/openid-configuration`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        console.error("Failed to fetch OIDC metadata");
        return null;
      }
      
      const metadata = await metadataResponse.json();
      const jwksUri = metadata.jwks_uri;
      
      if (!jwksUri) {
        console.error("No jwks_uri found in OIDC metadata");
        return null;
      }

      // Import jose and verify token
      const { jwtVerify, createRemoteJWKSet } = await import('jose');
      const JWKS = createRemoteJWKSet(new URL(jwksUri));

      const { payload: verifiedPayload } = await jwtVerify(token, JWKS, {
        issuer: issuer,
        audience: microsoftClientId,
        clockTolerance: '60s'
      });

      // Extract user information
      const microsoftId = verifiedPayload.sub || verifiedPayload.oid as string;
      const email = verifiedPayload.email as string || verifiedPayload.preferred_username as string || '';
      const name = verifiedPayload.name as string || '';

      if (!microsoftId || !email) {
        console.error("Missing required fields in Microsoft token");
        return null;
      }

      // Return in GoogleUserPayload format for compatibility
      return {
        sub: microsoftId,
        email: email.toLowerCase(),
        name: name,
        picture: '',
        email_verified: verifiedPayload.email_verified !== false,
      } as GoogleUserPayload;

    } catch (error) {
      console.error("Error verifying Microsoft token:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Hash password using Argon2id
   */
  private async hashPassword(password: string): Promise<string> {
    return await PasswordSecurityService.hashPassword(password);
  }

  /**
   * Validate password using Argon2id
   */
  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await PasswordSecurityService.verifyPassword(plainPassword, hashedPassword);
  }

  /**
   * Get password strength meter data
   */
  async getPasswordStrength(password: string): Promise<{
    score: number;
    feedback: string[];
    strength: 'weak' | 'medium' | 'strong';
  }> {
    return PasswordSecurityService.getPasswordStrengthMeter(password);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const newAccessToken = await TokenService.refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    return { accessToken: newAccessToken };
  }

  /**
   * Logout user (revoke all tokens)
   */
  async logoutUser(userId: number): Promise<void> {
    TokenService.revokeAllUserTokens(userId);
  }

  /**
   * Logout from specific session
   */
  async logoutSession(refreshToken: string): Promise<void> {
    const decoded = await TokenService.verifyRefreshToken(refreshToken);
    if (decoded) {
      TokenService.revokeRefreshToken(decoded.tokenId);
    }
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: number): Promise<Array<{
    sessionId: string;
    createdAt: Date;
    lastUsed: Date;
    userAgent?: string;
    ipAddress?: string;
  }>> {
    return TokenService.getUserSessions(userId);
  }

  /**
   * Generate random password for Google users
   */
  private generateRandomPassword(): string {
    return PasswordSecurityService.generateSecurePassword(16);
  }
}
