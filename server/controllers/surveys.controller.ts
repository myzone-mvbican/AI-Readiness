import { Request, Response } from "express";
import { SurveysModel } from "../models/survey.model";
import Papa from "papaparse";
import fs from "fs";

export class SurveysController {
  static async getAll(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid team ID",
        });
      }

      const surveysWithAuthors = await SurveysModel.getWithAuthors(teamId);

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
  }

  static async getById(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      const survey = await SurveysModel.getWithAuthor(surveyId);

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
  }

  static async create(req: Request, res: Response) {
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

      // Validate CSV content
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const validation = CsvValidator.validate(fileContent);
      
      if (!validation.isValid) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Invalid CSV format",
          errors: validation.errors
        });
      }

      // Use validated questions count
      const questionsCountNum = validation.questionsCount;

      // Process multiple teams
      let selectedTeamIds: number[] = [];
      if (req.body.teamIds) {
        try {
          if (req.body.teamIds === "global") {
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

      const surveyData = {
        title,
        questionsCount: questionsCountNum,
        status: status || "draft",
        fileReference: req.file.path,
        authorId: req.user!.id,
      };

      const newSurvey = await SurveysModel.create(surveyData);

      // Assign teams if provided
      if (selectedTeamIds.length > 0) {
        await SurveysModel.updateTeams(newSurvey.id, selectedTeamIds);
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
  }

  static async update(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Check if survey exists
      const existingSurvey = await SurveysModel.getById(surveyId);
      if (!existingSurvey) {
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
          if (req.body.teamIds === "global") {
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

      // If a new file was uploaded
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
          }
        }

        updateData.fileReference = req.file.path;

        // Update questions count if provided
        if (req.body.questionsCount) {
          const questionsCountNum = parseInt(req.body.questionsCount);
          if (isNaN(questionsCountNum)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileError) {
              console.error(`Error deleting file ${req.file.path}:`, fileError);
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

      const updatedSurvey = await SurveysModel.update(surveyId, updateData);

      // Update assigned teams if provided
      if (req.body.teamIds) {
        await SurveysModel.updateTeams(surveyId, selectedTeamIds);
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
  }

  static async delete(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Check if survey exists
      const existingSurvey = await SurveysModel.getById(surveyId);
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
        }
      }

      const deleted = await SurveysModel.delete(surveyId);

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
  }

  static async getQuestions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Get survey details
      const survey = await SurveysModel.getById(id);

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
        .filter((row: any) => row["Question Summary"]?.trim())
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
  }

  static async getTeams(req: Request, res: Response) {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID",
        });
      }

      // Check if survey exists
      const survey = await SurveysModel.getById(surveyId);
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found",
        });
      }

      // Get teams associated with this survey
      const teamIds = await SurveysModel.getTeams(surveyId);

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
  }
}
