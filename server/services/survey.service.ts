import fs from "fs";
import path from "path";
import { SurveyRepository } from "../repositories/survey.repository"; 
import { CompletionService } from "./completion.service";
import { ValidationError, NotFoundError, ForbiddenError, InternalServerError } from "../utils/errors";

export interface CreateSurveyData {
  title: string;
  questionsCount: number;
  status?: string;
  fileReference: string;
  authorId: number;
  completionLimit?: number | null;
  teamIds?: number[];
}

export interface UpdateSurveyData {
  title?: string;
  status?: string;
  completionLimit?: number | string | null;
  fileReference?: string;
  questionsCount?: number;
  teamIds?: number[];
}

export interface SurveyFilters {
  search?: string;
  status?: string;
  teamId?: number;
}

export interface SurveyPaginationOptions {
  page: number;
  pageSize: number;
  limit: number;
  search?: string;
  status?: string;
  teamId?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CompletionEligibilityResult {
  canTake: boolean;
  completionCount: number;
  completionLimit: number | null;
  reason?: string;
}

export class SurveyService {
  private static surveyRepository = new SurveyRepository();

  /**
   * Get survey by ID
   */
  static async getById(surveyId: number): Promise<any> {
    try {
      const repository = new SurveyRepository();
      const survey = await repository.getByIdWithTeams(surveyId);
      
      if (!survey) {
        return null;
      }

      // Load questions from CSV file
      const { CsvParser } = await import("../helpers");
      const { questions } = CsvParser.parse(survey.fileReference);

      return {
        ...survey,
        questions,
      };
    } catch (error) {
      throw new InternalServerError("Failed to get survey by ID");
    }
  } 

  /**
   * Get surveys for a team with pagination and filtering
   */
  static async getSurveysForTeam(
    teamId: number,
    options: SurveyPaginationOptions
  ): Promise<any> {
    try {
      const repositoryOptions = {
        ...options,
        limit: options.pageSize
      };
      return await this.surveyRepository.getWithAuthorsPaginated(teamId, repositoryOptions);
    } catch (error: any) {
      console.error("Error getting surveys for team:", error);
      throw new InternalServerError("Failed to retrieve surveys");
    }
  }

  /**
   * Get a survey by ID
   */
  static async getSurveyById(surveyId: number): Promise<any> {
    try {
      const survey = await this.surveyRepository.getByIdWithTeams(surveyId);
      if (!survey) {
        throw new NotFoundError("Survey");
      }
      return survey;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error getting survey by ID:", error);
      throw new InternalServerError("Failed to retrieve survey");
    }
  }

  /**
   * Create a new survey
   */
  static async createSurvey(
    surveyData: CreateSurveyData,
    filePath: string
  ): Promise<any> {
    try {
      // Validate required fields
      if (!surveyData.title || !surveyData.questionsCount) {
        throw new ValidationError("Title and questions count are required");
      }

      // Validate questions count
      if (isNaN(surveyData.questionsCount) || surveyData.questionsCount < 1) {
        throw new ValidationError("Questions count must be a positive number");
      }

      // Validate completion limit if provided
      if (surveyData.completionLimit !== undefined && surveyData.completionLimit !== null) {
        if (typeof surveyData.completionLimit === 'number' && (isNaN(surveyData.completionLimit) || surveyData.completionLimit < 1)) {
          throw new ValidationError("Completion limit must be a positive number");
        }
      }

      // Store relative path from project root for portability
      const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, '');
      
      const surveyRecord = {
        title: surveyData.title,
        questionsCount: surveyData.questionsCount,
        status: surveyData.status || "draft",
        fileReference: relativePath,
        authorId: surveyData.authorId,
        completionLimit: surveyData.completionLimit,
      };

      const newSurvey = await this.surveyRepository.create(surveyRecord);

      // Assign teams if provided
      if (surveyData.teamIds && surveyData.teamIds.length > 0) {
        await this.surveyRepository.updateTeams(newSurvey.id, surveyData.teamIds);
      }

      return newSurvey;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Error creating survey:", error);
      throw new InternalServerError("Failed to create survey");
    }
  }

  /**
   * Update a survey
   */
  static async updateSurvey(
    surveyId: number,
    updateData: UpdateSurveyData,
    userId: number,
    newFilePath?: string
  ): Promise<any> {
    try {
      // Check if survey exists
      const existingSurvey = await this.surveyRepository.getById(surveyId);
      if (!existingSurvey) {
        throw new NotFoundError("Survey");
      }

      // Ensure the user is the author of the survey
      if (existingSurvey.authorId !== userId) {
        throw new ForbiddenError("Only the author can update this survey");
      }

      // Prepare update data
      const updateFields: any = {};

      if (updateData.title) {
        updateFields.title = updateData.title;
      }

      if (updateData.status) {
        updateFields.status = updateData.status;
      }

      if (updateData.completionLimit !== undefined) {
        if (updateData.completionLimit === null) {
          updateFields.completionLimit = null;
        } else {
          const completionLimitNum = typeof updateData.completionLimit === 'string' 
            ? parseInt(updateData.completionLimit) 
            : updateData.completionLimit;
          if (isNaN(completionLimitNum) || completionLimitNum < 1) {
            throw new ValidationError("Completion limit must be a positive number");
          }
          updateFields.completionLimit = completionLimitNum;
        }
      }

      // Handle file update
      if (newFilePath) {
        // Delete the old file if it exists
        if (existingSurvey.fileReference) {
          try {
            const oldFilePath = this.resolveFilePath(existingSurvey.fileReference);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (fileError) {
            console.error(`Error deleting file ${existingSurvey.fileReference}:`, fileError);
          }
        }

        // Store relative path from project root for portability
        const relativePath = newFilePath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, '');
        updateFields.fileReference = relativePath;
      }

      if (updateData.questionsCount) {
        if (isNaN(updateData.questionsCount)) {
          throw new ValidationError("Questions count must be a valid number");
        }
        updateFields.questionsCount = updateData.questionsCount;
      }

      // Update assigned teams if provided
      if (updateData.teamIds !== undefined) {
        await this.surveyRepository.updateTeams(surveyId, updateData.teamIds);
      }

      const updatedSurvey = await this.surveyRepository.update(surveyId, updateFields);

      return updatedSurvey;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      console.error("Error updating survey:", error);
      throw new InternalServerError("Failed to update survey");
    }
  }

  /**
   * Delete a survey
   */
  static async deleteSurvey(surveyId: number, userId: number): Promise<boolean> {
    try {
      // Check if survey exists
      const existingSurvey = await this.surveyRepository.getById(surveyId);
      if (!existingSurvey) {
        throw new NotFoundError("Survey");
      }

      // Ensure the user is the author of the survey
      if (existingSurvey.authorId !== userId) {
        throw new ForbiddenError("Only the author can delete this survey");
      }

      // Delete the associated file if it exists
      if (existingSurvey.fileReference) {
        try {
          const filePath = this.resolveFilePath(existingSurvey.fileReference);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(`Error deleting file ${existingSurvey.fileReference}:`, fileError);
        }
      }

      return await this.surveyRepository.delete(surveyId);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error("Error deleting survey:", error);
      throw new InternalServerError("Failed to delete survey");
    }
  }

  /**
   * Get teams associated with a survey
   */
  static async getSurveyTeams(surveyId: number): Promise<number[]> {
    try {
      // Check if survey exists
      const survey = await this.surveyRepository.getById(surveyId);
      if (!survey) {
        throw new NotFoundError("Survey");
      }

      return await this.surveyRepository.getTeams(surveyId);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error getting survey teams:", error);
      throw new InternalServerError("Failed to retrieve teams for survey");
    }
  }

  /**
   * Check if user can take a survey based on completion limits
   */
  static async checkCompletionEligibility(
    surveyId: number,
    userId?: number,
    guestEmail?: string
  ): Promise<CompletionEligibilityResult> {
    try {
      return await CompletionService.canUserTakeSurvey(surveyId, userId, guestEmail);
    } catch (error: any) {
      console.error("Error checking completion eligibility:", error);
      throw new InternalServerError("Failed to check completion eligibility");
    }
  }

  /**
   * Get all surveys for assessment modal
   */
  static async getAllSurveysForAssessment(options: SurveyPaginationOptions): Promise<any> {
    try {
      return await this.surveyRepository.getWithAuthorsPaginated(0, options);
    } catch (error: any) {
      console.error("Error getting all surveys for assessment:", error);
      throw new InternalServerError("Failed to retrieve surveys for assessment");
    }
  }

  /**
   * Get completion status for all surveys that the user can see
   */
  static async getCompletionStatus(userId: number): Promise<{ [surveyId: number]: CompletionEligibilityResult }> {
    try {
      // Get all global surveys that the user can access
      const surveys = await this.surveyRepository.getAll({ teamId: 0 });
      const completionStatus: { [surveyId: number]: CompletionEligibilityResult } = {};

      for (const survey of surveys) {
        const result = await CompletionService.canUserTakeSurvey(
          survey.id,
          userId,
          undefined
        );

        completionStatus[survey.id] = {
          canTake: result.canTake,
          completionCount: result.completionCount,
          completionLimit: survey.completionLimit,
        };
      }

      return completionStatus;
    } catch (error: any) {
      console.error("Error getting completion status:", error);
      throw new InternalServerError("Failed to get completion status");
    }
  }

  /**
   * Process CSV file and validate its content
   */
  static async processCsvFile(filePath: string): Promise<{ questionsCount: number; isValid: boolean }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new ValidationError("CSV file not found");
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new ValidationError("CSV file is empty");
      }

      // Basic validation - check if it has headers and data rows
      const questionsCount = lines.length - 1; // Subtract header row
      
      if (questionsCount < 1) {
        throw new ValidationError("CSV file must contain at least one question");
      }

      return {
        questionsCount,
        isValid: true
      };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Error processing CSV file:", error);
      throw new InternalServerError("Failed to process CSV file");
    }
  }

  /**
   * Validate CSV data content
   */
  static validateCsvData(csvData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!csvData || typeof csvData !== 'object') {
      errors.push("Invalid CSV data format");
    }

    if (!csvData.title || typeof csvData.title !== 'string') {
      errors.push("Title is required and must be a string");
    }

    if (!csvData.questionsCount || isNaN(csvData.questionsCount)) {
      errors.push("Questions count is required and must be a number");
    }

    if (csvData.questionsCount < 1) {
      errors.push("Questions count must be at least 1");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file type
   */
  static validateFileType(file: any, allowedTypes: string[] = ['text/csv', 'application/csv']): boolean {
    if (!file || !file.mimetype) {
      return false;
    }

    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Parse and transform survey creation data from request
   */
  static parseSurveyCreationData(req: any): { data: CreateSurveyData; error?: string } {
    try {
      const { title, teamId, questionsCount, status, completionLimit, teamIds } = req.body;

      // Optional teamId (null means global survey)
      let teamIdNum = null;
      if (teamId) {
        teamIdNum = parseInt(teamId);
      }

      const questionsCountNum = parseInt(questionsCount);

      // Process multiple teams
      let selectedTeamIds: number[] = [];
      if (req.body.teamIds) {
        if (req.body.teamIds === "global") {
          selectedTeamIds = [];
        } else {
          selectedTeamIds = JSON.parse(req.body.teamIds);
          if (!Array.isArray(selectedTeamIds)) {
            throw new Error("teamIds must be an array");
          }
        }
      }

      // Handle completion limit
      let completionLimitNum = null;
      if (completionLimit) {
        completionLimitNum = parseInt(completionLimit);
      }

      const surveyData: CreateSurveyData = {
        title,
        questionsCount: questionsCountNum,
        status: status || "draft",
        fileReference: req.file.path, // This will be overridden by the service
        authorId: req.user!.id,
        completionLimit: completionLimitNum,
        teamIds: selectedTeamIds,
      };

      return { data: surveyData };
    } catch (error: any) {
      return { data: {} as CreateSurveyData, error: error.message || "Invalid survey data" };
    }
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}-${timestamp}-${randomSuffix}${extension}`;
  }

  /**
   * Clean up temporary file
   */
  static cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }

  /**
   * Resolve a file path that might be absolute or relative
   */
  private static resolveFilePath(filePath: string): string {
    // If it's already an absolute path that exists, return it
    if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
      return filePath;
    }
    
    // If it's a relative path, resolve from project root
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
    
    // If the path contains the filename, try to find it in uploads
    const filename = path.basename(filePath);
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(uploadsPath)) {
      return uploadsPath;
    }
    
    // Return the original path if nothing else works
    return filePath;
  }
}
