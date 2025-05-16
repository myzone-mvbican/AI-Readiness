import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthController } from "./controllers/auth.controller";
import { TeamController } from "./controllers/team.controller";
import { UsersController } from "./controllers/users.controller";
import { AssessmentController } from "./controllers/assessment.controller";

// Import middleware if needed for protected routes
import { auth, requireAdmin } from "./middleware/auth";
import { upload } from "./middleware/upload";
import Papa from "papaparse";
import cors from "cors";
import * as fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors());

  // API routes - path prefixed with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });

  // Endpoint to serve CSV files directly - with fallback to default survey
  app.get("/api/csv-file/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log("CSV file requested:", filename);

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: "Filename is required",
        });
      }

      // List of possible places to look for the file
      const possiblePaths = [
        `${process.cwd()}/public/uploads/${filename}`,
        `${process.cwd()}/public/uploads/surveys/${filename}`,
      ];

      console.log("Looking for CSV file in these locations:", possiblePaths);

      // Check multiple file paths
      let fileContent = null;
      let foundPath = null;

      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          console.log("File found at:", path);
          foundPath = path;
          fileContent = fs.readFileSync(path, "utf8");
          break;
        }
      }

      // If we still don't have a file, give up
      if (!fileContent) {
        console.error("No survey file could be found");
        return res.status(404).json({
          success: false,
          message: "No survey file could be found",
        });
      }

      console.log(
        `Serving CSV file from ${foundPath} (${fileContent.length} bytes)`,
      );

      // Set appropriate headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      // Send the file content
      return res.send(fileContent);
    } catch (error) {
      console.error("Error serving CSV file:", error);
      return res.status(500).json({
        success: false,
        message: "Error serving CSV file",
      });
    }
  });

  // Authentication routes

  // User signup endpoint (with support for both /signup and /register paths)
  app.post(["/api/signup", "/api/register"], AuthController.register);
  // User login endpoint
  app.post("/api/login", AuthController.login);
  // Google OAuth login/signup endpoint
  app.post("/api/auth/google/login", AuthController.loginGoogle);

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
  app.get("/api/teams", auth, TeamController.getUserTeams);
  // Create a new team
  app.post("/api/teams", auth, TeamController.createTeam);
  // Add user to team
  app.post("/api/teams/:teamId/users", auth, TeamController.addUserToTeam);
  // Admin-only: Get all teams
  app.get("/api/admin/teams", auth, requireAdmin, TeamController.getAll);

  // Users endpoints (all protected routes)

  // Admin-only: Get all users
  app.get("/api/admin/users", auth, requireAdmin, UsersController.getAll);
  // Admin-only: Update a user
  app.put("/api/admin/users/:id", auth, requireAdmin, UsersController.update);
  // Admin-only: Delete a user
  app.delete(
    "/api/admin/users/:id",
    auth,
    requireAdmin,
    UsersController.delete,
  );
  // Admin-only: Update a user's team assignments
  // To do: move into UsersController.update method
  app.patch(
    "/api/users/:id/teams",
    auth,
    requireAdmin,
    TeamController.updateUserTeams,
  );

  // User-facing survey routes

  // Get surveys for current user's selected team
  app.get("/api/surveys/:teamId", auth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid team ID",
        });
      }

      // If the team ID is 0, we only want to get global surveys
      if (teamId === 0) {
        // Special case for global surveys (team ID null)
        const surveys = await storage.getSurveys(0);

        return res.status(200).json({
          success: true,
          surveys,
        });
      }

      // For non-zero team IDs, verify access first
      const userTeams = await storage.getTeamsByUserId(req.user!.id);
      const teamIds = userTeams.map((team) => team.id);

      // Check if user has access to this team
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this team's surveys",
        });
      }

      // Get surveys for the team, including global surveys
      const surveys = await storage.getSurveys(teamId);

      return res.status(200).json({
        success: true,
        surveys,
      });
    } catch (error) {
      console.error("Error getting surveys:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve surveys",
      });
    }
  });
  // Original protected survey endpoint
  app.get("/api/surveys/detail/:id", auth, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      const survey = await storage.getSurveyById(surveyId);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found",
        });
      }

      // Get all teams for the user to verify access
      const userTeams = await storage.getTeamsByUserId(req.user!.id);
      const teamIds = userTeams.map((team) => team.id);

      // Check if survey is global (null teamId) or if user has access to any of the survey's teams
      const surveyTeamIds = await storage.getSurveyTeams(surveyId);

      // Allow access if:
      // 1. Survey is global (teamId is null and no teams assigned)
      // 2. User is part of any team the survey is assigned to
      const isGlobalSurvey =
        survey.teamId === null && surveyTeamIds.length === 0;
      const hasTeamAccess = surveyTeamIds.some((teamId) =>
        teamIds.includes(teamId),
      );

      if (!isGlobalSurvey && !hasTeamAccess) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this survey",
        });
      }

      return res.status(200).json({
        success: true,
        survey,
      });
    } catch (error) {
      console.error(`Error getting survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve survey",
      });
    }
  });
  
  // Survey Administration routes (admin only)

  // Get all surveys for a team
  app.get(
    "/api/admin/surveys/:teamId",
    auth,
    requireAdmin,
    async (req, res) => {
      try {
        const teamId = parseInt(req.params.teamId);
        if (isNaN(teamId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid team ID",
          });
        }

        // Team ID 0 is a special case to fetch all global surveys only
        const surveysWithAuthors = await storage.getSurveysWithAuthors(teamId);

        return res.status(200).json({
          success: true,
          surveys: surveysWithAuthors,
        });
      } catch (error) {
        console.error("Error getting surveys:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve surveys",
        });
      }
    },
  );

  // Get a specific survey with author details
  app.get(
    "/api/admin/surveys/detail/:id",
    auth,
    requireAdmin,
    async (req, res) => {
      try {
        const surveyId = parseInt(req.params.id);
        if (isNaN(surveyId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid survey ID",
          });
        }

        const survey = await storage.getSurveyWithAuthor(surveyId);

        if (!survey) {
          return res.status(404).json({
            success: false,
            message: "Survey not found",
          });
        }

        return res.status(200).json({
          success: true,
          survey,
        });
      } catch (error) {
        console.error(`Error getting survey ${req.params.id}:`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve survey",
        });
      }
    },
  );

  // Create a new survey with file upload
  app.post(
    "/api/admin/surveys",
    auth,
    requireAdmin,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "CSV file is required",
          });
        }

        // Get form data
        const { title, teamId, questionsCount, status } = req.body;

        // Validate required fields
        if (!title || !questionsCount) {
          // Delete the uploaded file if validation fails
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(400).json({
            success: false,
            message:
              "Missing required fields. Title and questionsCount are required.",
          });
        }

        // Create survey data
        const questionsCountNum = parseInt(questionsCount);

        // Optional teamId (null means global survey)
        let teamIdNum = null;
        if (teamId) {
          teamIdNum = parseInt(teamId);
          if (isNaN(teamIdNum)) {
            // Non-empty but invalid teamId
            // Delete the uploaded file if validation fails
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
              success: false,
              message:
                "Invalid team ID format. Must be a valid number or empty for global surveys.",
            });
          }
        }

        if (isNaN(questionsCountNum)) {
          // Delete the uploaded file if validation fails
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(400).json({
            success: false,
            message: "Invalid questions count format. Must be a valid number.",
          });
        }

        // Process multiple teams (from teamIds string)
        let selectedTeamIds: number[] = [];
        if (req.body.teamIds) {
          try {
            // Parse the teamIds string, which can be either "global" or a JSON array of team IDs
            if (req.body.teamIds === "global") {
              // Global survey - no teams assigned
              selectedTeamIds = [];
            } else {
              selectedTeamIds = JSON.parse(req.body.teamIds);
              if (!Array.isArray(selectedTeamIds)) {
                throw new Error("teamIds must be an array");
              }
            }
          } catch (error) {
            console.error("Invalid teamIds format:", error);
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              success: false,
              message:
                "Invalid teamIds format. Must be 'global' or a JSON array.",
            });
          }
        }

        // Create survey data object with cleaned values
        const surveyData = {
          title,
          questionsCount: questionsCountNum,
          status: status || "draft",
          fileReference: req.file.path,
          authorId: req.user!.id,
        };

        // Only add teamId if it has a valid value (not null or undefined)
        // This is kept for backward compatibility - we'll use the junction table going forward
        if (teamIdNum !== null && teamIdNum !== undefined) {
          Object.assign(surveyData, { teamId: teamIdNum });
        }

        const newSurvey = await storage.createSurvey(surveyData);

        // Now, if we have selected team IDs, assign them using the junction table
        if (selectedTeamIds.length > 0) {
          await storage.updateSurveyTeams(newSurvey.id, selectedTeamIds);
        }

        return res.status(201).json({
          success: true,
          message: "Survey created successfully",
          survey: newSurvey,
        });
      } catch (error) {
        console.error("Error creating survey:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create survey",
        });
      }
    },
  );

  // Update a survey with optional file upload
  app.put(
    "/api/admin/surveys/:id",
    auth,
    requireAdmin,
    upload.single("file"),
    async (req, res) => {
      try {
        const surveyId = parseInt(req.params.id);
        if (isNaN(surveyId)) {
          // Clean up any uploaded file
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(400).json({
            success: false,
            message: "Invalid survey ID"
          });
        }

        // Check if survey exists
        const existingSurvey = await storage.getSurveyById(surveyId);
        if (!existingSurvey) {
          // Clean up any uploaded file
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(404).json({
            success: false,
            message: "Survey not found",
          });
        }

        // Ensure the user is the author of the survey
        if (existingSurvey.authorId !== req.user!.id) {
          // Clean up any uploaded file
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(403).json({
            success: false,
            message: "Only the author can update this survey",
          });
        }

        // Prepare update data
        const updateData: any = {};

        // Update title if provided
        if (req.body.title) {
          updateData.title = req.body.title;
        }

        // Update status if provided
        if (req.body.status) {
          updateData.status = req.body.status;
        }

        // Process team selection
        let selectedTeamIds: number[] = [];
        if (req.body.teamIds) {
          try {
            // Parse the teamIds string, which can be either "global" or a JSON array of team IDs
            if (req.body.teamIds === "global") {
              // Global survey - no teams assigned
              selectedTeamIds = [];
            } else {
              selectedTeamIds = JSON.parse(req.body.teamIds);
              if (!Array.isArray(selectedTeamIds)) {
                throw new Error("teamIds must be an array");
              }
            }
          } catch (error) {
            console.error("Invalid teamIds format:", error);
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              success: false,
              message:
                "Invalid teamIds format. Must be 'global' or a JSON array.",
            });
          }
        }

        // If a new file was uploaded, update file reference and questions count
        if (req.file) {
          // Delete the old file if it exists
          if (
            existingSurvey.fileReference &&
            fs.existsSync(existingSurvey.fileReference)
          ) {
            try {
              fs.unlinkSync(existingSurvey.fileReference);
            } catch (fileError) {
              console.error(
                `Error deleting file ${existingSurvey.fileReference}:`,
                fileError,
              );
              // Continue with update even if file deletion fails
            }
          }

          updateData.fileReference = req.file.path;

          // If questions count is provided, use that value
          if (req.body.questionsCount) {
            const questionsCountNum = parseInt(req.body.questionsCount);

            if (isNaN(questionsCountNum)) {
              // Delete the uploaded file
              try {
                fs.unlinkSync(req.file.path);
              } catch (fileError) {
                console.error(
                  `Error deleting file ${req.file.path}:`,
                  fileError,
                );
              }

              return res.status(400).json({
                success: false,
                message:
                  "Invalid questions count format. Must be a valid number.",
              });
            }

            updateData.questionsCount = questionsCountNum;
          }
        }

        const updatedSurvey = await storage.updateSurvey(surveyId, updateData);

        // Update assigned teams if provided
        if (req.body.teamIds) {
          await storage.updateSurveyTeams(surveyId, selectedTeamIds);
        }

        return res.status(200).json({
          success: true,
          message: "Survey updated successfully",
          survey: updatedSurvey,
        });
      } catch (error) {
        console.error(`Error updating survey ${req.params.id}:`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to update survey",
        });
      }
    },
  );

  // Get teams assigned to a survey
  app.get(
    "/api/admin/surveys/:id/teams",
    auth,
    requireAdmin,
    async (req, res) => {
      try {
        const surveyId = parseInt(req.params.id);
        if (isNaN(surveyId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid survey ID",
          });
        }

        // Check if survey exists
        const survey = await storage.getSurveyById(surveyId);
        if (!survey) {
          return res.status(404).json({
            success: false,
            message: "Survey not found",
          });
        }

        // Get teams associated with this survey
        const teamIds = await storage.getSurveyTeams(surveyId);

        return res.status(200).json({
          success: true,
          teamIds,
        });
      } catch (error) {
        console.error(
          `Error retrieving teams for survey ${req.params.id}:`,
          error,
        );
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve teams for survey",
        });
      }
    },
  );

  // Delete a survey and its file
  app.delete("/api/admin/surveys/:id", auth, requireAdmin, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Check if survey exists
      const existingSurvey = await storage.getSurveyById(surveyId);
      if (!existingSurvey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found",
        });
      }

      // Ensure the user is the author of the survey
      if (existingSurvey.authorId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: "Only the author can delete this survey",
        });
      }

      // Delete the associated file if it exists
      if (
        existingSurvey.fileReference &&
        fs.existsSync(existingSurvey.fileReference)
      ) {
        try {
          fs.unlinkSync(existingSurvey.fileReference);
        } catch (fileError) {
          console.error(
            `Error deleting file ${existingSurvey.fileReference}:`,
            fileError,
          );
          // Continue with survey deletion even if file deletion fails
        }
      }

      const deleted = await storage.deleteSurvey(surveyId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete survey",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Survey deleted successfully",
      });
    } catch (error) {
      console.error(`Error deleting survey ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete survey",
      });
    }
  });

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

  // Public routes

  // Check if user email exists (public endpoint)
  app.get("/api/public/users/exists", UsersController.exists);
  // Create guest assessment (public endpoint)
  app.post("/api/public/assessments", AssessmentController.createGuest);
  // Public endpoint for guest users to access survey details
  app.get("/api/public/surveys/detail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Get survey details
      const survey = await storage.getSurveyById(id);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found",
        });
      }

      return res.status(200).json({
        success: true,
        survey,
      });
    } catch (error) {
      console.error("Error fetching public survey:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch public survey",
      });
    }
  });
  // Get questions for a specific survey (public endpoint)
  app.get("/api/public/surveys/:id/questions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Get survey details
      const survey = await storage.getSurveyById(id);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found",
        });
      }

      // Read and parse the CSV file
      const fileContent = fs.readFileSync(survey.fileReference, "utf8");

      // Parse CSV
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      // Map CSV data to questions with the correct column names
      const questions = parsedData.data
        .filter((row) => row["Question Summary"]?.trim()) // Only include rows with non-empty questions
        .map((row: any, index: number) => {
          return {
            id: index + 1,
            question: row["Question Summary"] || "",
            category: row["Category"] || "",
            details: row["Question Details"] || "",
          };
        });

      return res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching survey questions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch survey questions",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
