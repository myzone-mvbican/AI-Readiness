import fs from "fs";
import path from "path";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { AuthController } from "./controllers/auth.controller";
import { TeamController } from "./controllers/team.controller";
import { UserController } from "./controllers/user.controller";
import { SurveyController } from "./controllers/survey.controller";
import { AssessmentController } from "./controllers/assessment.controller";
import { AIController } from "./controllers/ai.controller";
import { BenchmarkController } from "./controllers/benchmark.controller";
import { PasswordResetController } from "./controllers/password-reset.controller";
import {
  insertUserSchema,
  updateUserSchema,
  loginSchema,
  googleAuthSchema,
  googleConnectSchema,
  microsoftAuthSchema,
} from "@shared/validation/schemas";

// Import middleware if needed for protected routes
import { auth, requireAdmin } from "./middleware/auth";
import { upload } from "./middleware/upload";
import {
  validateBody,
  validateQuery,
  validateParams,
  validateSurveyCreation,
  validateUrlAnalysis,
} from "./middleware/validation";
import {
  teamCreationSchema,
  userTeamAssignmentSchema,
  userRoleUpdateSchema,
  userTeamsUpdateSchema,
  assessmentCreationSchema,
  assessmentUpdateSchema,
  guestAssessmentCreationSchema,
  guestAssessmentDataSchema,
  guestAssessmentUpdateSchema,
  surveyUpdateSchema,
  completionEligibilitySchema,
  aiSuggestionSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  tokenQuerySchema,
  emailQuerySchema,
  userSearchByNameQuerySchema,
} from "./middleware/schemas";
import {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  sensitiveOperationsLimiter,
  progressiveDelay,
  accountLockoutLimiter,
  // Enhanced rate limiters
  authProgressiveDelay,
  authRateLimit,
  sensitiveOperationsProgressiveDelay,
  sensitiveOperationsRateLimit,
  generalApiLimiter,
} from "./middleware/rateLimiting";
import { validateCSRFToken } from "./middleware/csrf";
import {
  requestSizeLimiter,
  requestSizeLimits,
} from "./middleware/requestSizeLimits";
import { getProjectRoot } from "./utils/environment";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (no rate limiting)
  app.get("/api/health", (req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  // PDF download route - serve PDF files with correct headers and auto-recovery
  app.get("/uploads/*", async (req, res) => {
    try {
      // Remove leading slash to prevent path.join from treating it as absolute
      const requestedPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
      const filePath = path.join(getProjectRoot(), "public", requestedPath);

      // Check if it's a PDF file request
      if (path.extname(filePath).toLowerCase() !== ".pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Check if file exists, attempt recovery if missing
      if (!fs.existsSync(filePath)) {
        console.log(`[PDF Download] File not found, attempting recovery: ${requestedPath}`);
        
        const { PdfRecoveryService } = await import("./services/pdf-recovery.service");
        const recoveryResult = await PdfRecoveryService.checkAndRecover(requestedPath);

        if (recoveryResult.filePath && fs.existsSync(recoveryResult.filePath)) {
          console.log(`[PDF Download] Recovery successful, serving regenerated file`);
          
          // Set proper headers for PDF download
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${path.basename(recoveryResult.filePath)}"`,
          );

          // Stream the recovered file
          const fileStream = fs.createReadStream(recoveryResult.filePath);
          fileStream.pipe(res);
          return;
        }

        // Recovery failed, return 404 with details
        console.error(`[PDF Download] Recovery failed: ${recoveryResult.error}`);
        return res.status(404).json({ 
          error: "File not found",
          details: recoveryResult.error,
          recoveryAttempted: true
        });
      }

      // File exists, serve it normally
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(filePath)}"`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error("[PDF Download] Error serving PDF:", error);
      return res.status(500).json({ 
        error: "Failed to serve PDF file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // API routes - path prefixed with /api

  // Password strength endpoint
  app.post(
    "/api/password/strength",
    generalApiLimiter,
    AuthController.getPasswordStrength,
  );

  // Token refresh endpoint
  app.post("/api/auth/refresh", generalApiLimiter, AuthController.refreshToken);

  // Logout endpoint
  app.post("/api/auth/logout", auth, generalApiLimiter, AuthController.logout);

  // User JWT sessions endpoint
  app.get(
    "/api/auth/sessions",
    auth,
    generalApiLimiter,
    AuthController.getSessions,
  );

  // Authentication routes (with smaller size limits)

  // User signup endpoint (with support for both /signup and /register paths)
  app.post(
    ["/api/signup", "/api/register"],
    requestSizeLimiter,
    registrationLimiter,
    validateBody(insertUserSchema),
    AuthController.register,
  );
  // User login endpoint
  app.post(
    "/api/login",
    requestSizeLimiter,
    authProgressiveDelay,
    authRateLimit,
    accountLockoutLimiter,
    validateBody(loginSchema),
    AuthController.login,
  );
  // Google OAuth login/signup endpoint
  app.post(
    "/api/auth/google/login",
    requestSizeLimiter,
    authProgressiveDelay,
    authRateLimit,
    validateBody(googleAuthSchema),
    AuthController.loginGoogle,
  );

  // Microsoft OAuth login/signup endpoint
  app.post(
    "/api/auth/microsoft/login",
    requestSizeLimiter,
    authProgressiveDelay,
    authRateLimit,
    validateBody(microsoftAuthSchema),
    AuthController.loginMicrosoft,
  );

  // Password reset endpoints (with auth size limits)
  app.post(
    "/api/password/reset-request",
    requestSizeLimiter,
    authProgressiveDelay,
    passwordResetLimiter,
    validateBody(passwordResetRequestSchema),
    PasswordResetController.requestReset,
  );
  app.post(
    "/api/password/reset-confirm",
    requestSizeLimiter,
    authProgressiveDelay,
    passwordResetLimiter,
    validateBody(passwordResetConfirmSchema),
    PasswordResetController.confirmReset,
  );
  app.get(
    "/api/password/validate-token",
    passwordResetLimiter,
    validateQuery(tokenQuerySchema),
    PasswordResetController.validateToken,
  );

  // User profile endpoints (protected routes)

  // Get current user profile endpoint (protected route)
  app.get("/api/user", auth, generalApiLimiter, AuthController.profile);
  // Update user profile endpoint (protected route)
  app.put(
    "/api/user",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(updateUserSchema),
    AuthController.update,
  );
  // Connect Google account to existing user (protected route)
  app.post(
    "/api/user/google/connect",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(googleConnectSchema),
    AuthController.connectGoogle,
  );
  // Disconnect Google account from existing user (protected route)
  app.delete(
    "/api/user/google/disconnect",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    AuthController.disconnectGoogle,
  );
  // Connect Microsoft account to existing user (protected route)
  app.post(
    "/api/user/microsoft/connect",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(microsoftAuthSchema),
    AuthController.connectMicrosoft,
  );
  // Disconnect Microsoft account from existing user (protected route)
  app.delete(
    "/api/user/microsoft/disconnect",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    AuthController.disconnectMicrosoft,
  );

  // Team endpoints (all protected routes)

  // Get teams for current user
  // To do: move into AuthController.profile method
  app.get("/api/teams", auth, generalApiLimiter, TeamController.getTeams);
  // Create a new team
  app.post(
    "/api/teams",
    requestSizeLimiter,
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(teamCreationSchema),
    TeamController.create,
  );
  // Add user to team
  app.post(
    "/api/teams/:teamId/users",
    requestSizeLimiter,
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(userTeamAssignmentSchema),
    TeamController.addUser,
  );
  // Admin-only: Get all teams
  app.get(
    "/api/admin/teams",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.getAll,
  );

  // Users endpoints (all protected routes)

  // Admin-only: Get all users
  app.get(
    "/api/admin/users",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    UserController.getAll,
  );
  // Admin-only: Update a user
  app.put(
    "/api/admin/users/:id",
    requestSizeLimiter,
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    validateBody(updateUserSchema),
    UserController.update,
  );
  // Admin-only: Delete a user
  app.delete(
    "/api/admin/users/:id",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    UserController.delete,
  );
  // Admin-only: Update a user's team assignments
  app.patch(
    "/api/admin/users/:id/teams",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    validateBody(userTeamsUpdateSchema),
    TeamController.updateUserTeams,
  );

  // User-facing survey routes

  // Survey completion status endpoint (must come before parameterized routes)
  app.get(
    "/api/surveys/completion-status",
    auth,
    generalApiLimiter,
    SurveyController.getCompletionStatus,
  );
  // Get all surveys for assessment modal
  app.get(
    "/api/surveys/all",
    auth,
    generalApiLimiter,
    SurveyController.getAllForAssessment,
  );
  // Check completion eligibility for a survey
  app.post(
    "/api/surveys/:surveyId/completion-check",
    requestSizeLimiter,
    generalApiLimiter,
    validateBody(completionEligibilitySchema),
    SurveyController.checkCompletionEligibility,
  );

  // Survey Administration routes (admin only)

  // Get all surveys for a team
  app.get(
    "/api/admin/surveys/:teamId",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    SurveyController.getAll,
  );

  // Get a specific survey with author details
  app.get(
    "/api/admin/surveys/detail/:id",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    SurveyController.getById,
  );

  // Create a new survey with file upload
  app.post(
    "/api/admin/surveys",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    upload.single("file"),
    validateSurveyCreation,
    SurveyController.create,
  );

  // Update a survey with optional file upload
  app.put(
    "/api/admin/surveys/:id",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    upload.single("file"),
    validateBody(surveyUpdateSchema),
    SurveyController.update,
  );

  // Get teams assigned to a survey
  app.get(
    "/api/admin/surveys/:id/teams",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    SurveyController.getTeams,
  );

  // Delete a survey and its file
  app.delete(
    "/api/admin/surveys/:id",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    SurveyController.delete,
  );

  // Admin Team Management routes

  // Get all teams with member details (admin only)
  app.get(
    "/api/admin/teams",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.getAll,
  );

  // Update team (admin only)
  app.put(
    "/api/admin/teams/:id",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    validateBody(teamCreationSchema),
    TeamController.update,
  );

  // Delete team (admin only)
  app.delete(
    "/api/admin/teams/:id",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.delete,
  );

  // Restore team (admin only)
  app.post(
    "/api/admin/teams/:id/restore",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.restore,
  );

  // Hard delete team (admin only) - only if soft-deleted and has zero members
  app.delete(
    "/api/admin/teams/:id/hard-delete",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.hardDelete,
  );

  // Get team members (admin only)
  app.get(
    "/api/admin/teams/:id/members",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.getMembers,
  );

  // Remove user from team (admin only)
  app.delete(
    "/api/admin/teams/:teamId/users/:userId",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    TeamController.removeUser,
  );

  // Update user role in team (admin only)
  app.patch(
    "/api/admin/teams/:teamId/users/:userId/role",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    validateBody(userRoleUpdateSchema),
    TeamController.updateUserRole,
  );

  // Admin User Management routes

  // Search users by name or email (admin only)
  app.get(
    "/api/admin/users/search",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    validateQuery(userSearchByNameQuerySchema),
    UserController.searchUsers,
  );

  // Get assessments for a specific user (admin only)
  app.get(
    "/api/admin/users/:userId/assessments",
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    UserController.getUserAssessments,
  );

  // Assessment routes

  // Get all assessments for the current user
  app.get(
    "/api/assessments",
    auth,
    generalApiLimiter,
    AssessmentController.getAll,
  );
  // Create a new assessment
  app.post(
    "/api/assessments",
    requestSizeLimiter,
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(assessmentCreationSchema),
    AssessmentController.create,
  );
  // Get a specific assessment by ID
  app.get(
    "/api/assessments/:id",
    auth,
    generalApiLimiter,
    AssessmentController.getById,
  );
  // Update an assessment (for saving answers or changing status)
  app.patch(
    "/api/assessments/:id",
    requestSizeLimiter,
    validateCSRFToken,
    auth,
    generalApiLimiter,
    validateBody(assessmentUpdateSchema),
    AssessmentController.update,
  );
  // Delete an assessment
  app.delete(
    "/api/assessments/:id",
    validateCSRFToken,
    auth,
    generalApiLimiter,
    AssessmentController.delete,
  );
  // Benchmark routes
  app.get(
    "/api/assessments/:id/benchmark",
    auth,
    generalApiLimiter,
    BenchmarkController.getBenchmark,
  );

  // AI Suggestions endpoint
  app.post(
    "/api/ai-suggestions",
    requestSizeLimiter,
    validateCSRFToken,
    generalApiLimiter,
    validateBody(aiSuggestionSchema),
    AIController.generateSuggestions,
  );

  // AI industry analysis endpoint
  app.post(
    "/api/analyze-industry",
    validateCSRFToken,
    generalApiLimiter,
    validateUrlAnalysis,
    AIController.analyzeIndustry,
  );

  // Recalculate benchmark stats (admin only)
  app.post(
    "/api/admin/benchmark/recalculate",
    validateCSRFToken,
    sensitiveOperationsProgressiveDelay,
    sensitiveOperationsRateLimit,
    auth,
    requireAdmin,
    BenchmarkController.recalculateStats,
  );

  // Public routes
  // Check if user email exists (public endpoint)
  app.get(
    "/api/public/users/exists",
    generalApiLimiter,
    validateQuery(emailQuerySchema),
    UserController.exists,
  );
  // Create guest assessment (public endpoint)
  app.post(
    "/api/public/assessments",
    generalApiLimiter,
    validateBody(guestAssessmentDataSchema),
    AssessmentController.createGuest,
  );
  // Get guest assessment (public endpoint)
  app.get(
    "/api/public/assessments/:id",
    generalApiLimiter,
    AssessmentController.getGuestById,
  );
  // Update guest assessment (public endpoint)
  app.patch(
    "/api/public/assessments/:id",
    generalApiLimiter,
    validateBody(guestAssessmentUpdateSchema),
    AssessmentController.updateGuest,
  );
  // Public endpoint for guest users to access survey details
  app.get(
    "/api/public/surveys/detail/:id",
    generalApiLimiter,
    SurveyController.getById,
  );

  const httpServer = createServer(app);

  return httpServer;
}
