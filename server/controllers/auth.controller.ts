import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  InternalServerError,
} from "server/utils/errors";
import { env } from "server/utils/environment";

export class AuthController {
  private static authService = new AuthService();

  static async profile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await AuthController.authService.userRepository.getById(userId);

      if (!user) {
        return ApiResponse.notFound(res, "User not found");
      }

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = user;

      // Add cache control headers to prevent browser caching
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to retrieve user information");
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const updatedUser = await AuthController.authService.updateProfile(userId, req.body); // Already validated by middleware

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = updatedUser;

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.internalError(res, "Update failed due to an unexpected error");
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const { email, password: _password } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { user, tokens } = await AuthController.authService.loginUser(email, _password, userAgent, ipAddress);

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = user;

      // Set HttpOnly cookies
      TokenService.setTokenCookies(res, tokens);

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.internalError(res, "Login failed due to an unexpected error");
    }
  }

  static async loginGoogle(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const { credential } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { user, tokens } = await AuthController.authService.loginWithGoogle(credential, userAgent, ipAddress);

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = user;

      // Set HttpOnly cookies
      TokenService.setTokenCookies(res, tokens);

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.internalError(res, "Google authentication failed due to an unexpected error");
    }
  }

  static async loginMicrosoft(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const { credential } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { user, tokens } = await AuthController.authService.loginWithMicrosoft(credential, userAgent, ipAddress);

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = user;

      // Set HttpOnly cookies
      TokenService.setTokenCookies(res, tokens);

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.internalError(res, "Microsoft authentication failed due to an unexpected error");
    }
  }

  static async register(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const { user } = await AuthController.authService.registerUser(req.body);

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = user;

      // Generate session ID and token pair for cookie-based auth
      const sessionId = TokenService.generateSessionId();
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      const tokens = await TokenService.generateTokenPair(
        user.id,
        user.role || "client",
        sessionId,
        userAgent,
        ipAddress
      );

      // Set HttpOnly cookies
      TokenService.setTokenCookies(res, tokens);

      return ApiResponse.success(res, { user: safeUser }, 201);
    } catch (error) {
      if (error instanceof ConflictError) {
        return ApiResponse.conflict(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, {}, error.message);
      }
      if (error instanceof InternalServerError) {
        return ApiResponse.internalError(res, error.message);
      }
      return ApiResponse.internalError(res, "Registration failed due to an unexpected error");
    }
  }

  static async connectGoogle(req: Request, res: Response) {
    try {
      // req.body is already validated by middleware
      const userId = req.user!.id;
      const { credential } = req.body;

      const updatedUser = await AuthController.authService.connectGoogle(userId, credential);

      // Sanitize user data - remove all sensitive fields
      const {
        password,
        passwordHistory,
        resetToken,
        resetTokenExpiry,
        failedLoginAttempts,
        accountLockedUntil,
        ...safeUser
      } = updatedUser;

      return ApiResponse.success(res, { user: safeUser });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      if (error instanceof ConflictError) {
        return ApiResponse.conflict(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to connect Google account");
    }
  }

  static async disconnectGoogle(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const updatedUser = await AuthController.authService.disconnectGoogle(userId);
      const { password, ...userWithoutPassword } = updatedUser;

      return ApiResponse.success(res, { user: userWithoutPassword });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(res, error.message, error.details);
      }
      return ApiResponse.internalError(res, error instanceof Error ? error.message : "Failed to disconnect Google account");
    }
  }

  static async getPasswordStrength(req: Request, res: Response) {
    try {
      const { password } = req.body;
      if (!password) {
        return ApiResponse.validationError(res, { password: "Password is required" });
      }

      const strengthData = await AuthController.authService.getPasswordStrength(password);
      return ApiResponse.success(res, strengthData);
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to analyze password strength");
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = TokenService.getTokenFromRequest(req, 'refresh');
      if (!refreshToken) {
        return ApiResponse.unauthorized(res, "Refresh token not found");
      }

      const { accessToken } = await AuthController.authService.refreshAccessToken(refreshToken);

      // Set new access token cookie
      const isProduction = env.NODE_ENV === 'production';
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
      });

      return ApiResponse.success(res, { accessToken });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.internalError(res, "Failed to refresh token");
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (userId) {
        await AuthController.authService.logoutUser(userId);
      }

      // Clear token cookies
      TokenService.clearTokenCookies(res);

      return ApiResponse.success(res, { message: "Logged out successfully" });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to logout");
    }
  }

  static async getSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.unauthorized(res, "User not authenticated");
      }

      const sessions = await AuthController.authService.getUserSessions(userId);
      return ApiResponse.success(res, { sessions });
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to get user sessions");
    }
  }
}
