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

// Import middleware if needed for protected routes
import { auth, requireAdmin } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { ApiResponseUtil } from "./utils/api-response";
import cors from "cors";
import { ssrMiddleware } from "./middleware/ssr";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors());

  // Add SSR middleware for homepage
  app.use(ssrMiddleware);

  // SSR API endpoint to get meta tags and initial data
  app.get("/api/ssr/meta", async (req, res) => {
    try {
      const { renderPage, generateMetaTags, generateStructuredData } = await import('./ssr.js');
      
      const user = (req as any).user || null;
      const url = req.query.url as string || '/';
      const ssrContext = { url, user };
      
      const metaTags = generateMetaTags(ssrContext);
      const structuredData = generateStructuredData(ssrContext);
      
      res.json({
        metaTags,
        structuredData,
        user,
        ssrHtml: renderPage(ssrContext)
      });
    } catch (error) {
      console.error('SSR Meta Error:', error);
      res.status(500).json({ error: 'Failed to generate SSR meta data' });
    }
  });

  // API routes - path prefixed with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });

  // Demonstration endpoint showing API response standardization
  app.get("/api/demo/validation", (req, res) => {
    try {
      // Example of new standardized API response format
      const demoData = {
        validationSchemas: [
          "authSchemas.login", 
          "authSchemas.register", 
          "surveySchemas.create"
        ],
        consolidatedValidators: [
          "email", "password", "industry", "employeeCount"
        ],
        formUtils: [
          "getIndustryOptions", "validateCsvFile", "transformIndustryForSubmission"
        ]
      };
      
      return ApiResponseUtil.legacy.dataSuccess(res, demoData, "Form validation consolidation active");
    } catch (error) {
      return ApiResponseUtil.legacy.error(res, "Failed to load validation demo", 500);
    }
  });

  // Authentication routes

  // User signup endpoint (with support for both /signup and /register paths)
  app.post(["/api/signup", "/api/register"], AuthController.register);
  // User login endpoint
  app.post("/api/login", AuthController.login);
  // Google OAuth login/signup endpoint
  app.post("/api/auth/google/login", AuthController.loginGoogle);

  // Password reset endpoints
  app.post("/api/password/reset-request", PasswordResetController.requestReset);
  app.post("/api/password/reset-confirm", PasswordResetController.confirmReset);
  app.get("/api/password/validate-token", PasswordResetController.validateToken);

  // User profile endpoints (protected routes)

  // Get current user profile endpoint (protected route)
  app.get("/api/user", auth, AuthController.profile);
  // Update user profile endpoint (protected route)
  app.put("/api/user", auth, AuthController.update);
  // Connect Google account to existing user (protected route)
  app.post("/api/user/google/connect", auth, AuthController.connectGoogle);
  // Disconnect Google account from existing user (protected route)
  app.delete(
    "/api/user/google/disconnect",
    auth,
    AuthController.disconnectGoogle,
  );

  // Team endpoints (all protected routes)

  // Get teams for current user
  // To do: move into AuthController.profile method
  app.get("/api/teams", auth, TeamController.getTeams);
  // Create a new team
  app.post("/api/teams", auth, TeamController.create);
  // Add user to team
  app.post("/api/teams/:teamId/users", auth, TeamController.addUser);
  // Admin-only: Get all teams
  app.get("/api/admin/teams", auth, requireAdmin, TeamController.getAll);

  // Users endpoints (all protected routes)

  // Admin-only: Get all users
  app.get("/api/admin/users", auth, requireAdmin, UserController.getAll);
  // Admin-only: Update a user
  app.put("/api/admin/users/:id", auth, requireAdmin, UserController.update);
  // Admin-only: Delete a user
  app.delete("/api/admin/users/:id", auth, requireAdmin, UserController.delete);
  // Admin-only: Update a user's team assignments
  app.patch(
    "/api/admin/users/:id/teams",
    auth,
    requireAdmin,
    TeamController.updateUserTeams,
  );

  // User-facing survey routes

  // Survey completion status endpoint (must come before parameterized routes)
  app.get(
    "/api/surveys/completion-status",
    auth,
    SurveyController.getCompletionStatus,
  );
  // Get surveys for current user's selected team
  app.get("/api/surveys/:teamId", auth, SurveyController.getByTeamForUser);
  // Original protected survey endpoint
  app.get("/api/surveys/detail/:id", auth, SurveyController.getByIdForUser);
  // Check completion eligibility for a survey
  app.post("/api/surveys/:surveyId/completion-check", SurveyController.checkCompletionEligibility);

  // Survey Administration routes (admin only)

  // Get all surveys for a team
  app.get(
    "/api/admin/surveys/:teamId",
    auth,
    requireAdmin,
    SurveyController.getAll,
  );

  // Get a specific survey with author details
  app.get(
    "/api/admin/surveys/detail/:id",
    auth,
    requireAdmin,
    SurveyController.getById,
  );

  // Create a new survey with file upload
  app.post(
    "/api/admin/surveys",
    auth,
    requireAdmin,
    upload.single("file"),
    SurveyController.create,
  );

  // Update a survey with optional file upload
  app.put(
    "/api/admin/surveys/:id",
    auth,
    requireAdmin,
    upload.single("file"),
    SurveyController.update,
  );

  // Get teams assigned to a survey
  app.get(
    "/api/admin/surveys/:id/teams",
    auth,
    requireAdmin,
    SurveyController.getTeams,
  );

  // Delete a survey and its file
  app.delete(
    "/api/admin/surveys/:id",
    auth,
    requireAdmin,
    SurveyController.delete,
  );

  // Assessment routes

  // Get all assessments for the current user
  app.get("/api/assessments", auth, AssessmentController.getAll);
  // Create a new assessment
  app.post("/api/assessments", auth, AssessmentController.create);
  // Get a specific assessment by ID
  app.get("/api/assessments/:id", auth, AssessmentController.getById);
  // Update an assessment (for saving answers or changing status)
  app.patch("/api/assessments/:id", auth, AssessmentController.update);
  // Delete an assessment
  app.delete("/api/assessments/:id", auth, AssessmentController.delete);
  // Benchmark routes
  app.get(
    "/api/assessments/:id/benchmark",
    auth,
    BenchmarkController.getBenchmark,
  );

  // AI Suggestions endpoint
  app.post("/api/ai-suggestions", AIController.generateSuggestions);

  app.post(
    "/api/admin/benchmark/recalculate",
    auth,
    requireAdmin,
    BenchmarkController.recalculateStats,
  );

  // Public routes

  // Check if user email exists (public endpoint)
  app.get("/api/public/users/exists", UserController.exists);
  // Create guest assessment (public endpoint)
  app.post("/api/public/assessments", AssessmentController.createGuest);
  app.patch("/api/public/assessments/:id", AssessmentController.updateGuest);
  // Public endpoint for guest users to access survey details
  app.get("/api/public/surveys/detail/:id", SurveyController.getById);

  const httpServer = createServer(app);

  return httpServer;
}
