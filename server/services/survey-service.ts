import { CreateSurveyInput, ApiResponse, Survey, SurveyQuestion } from '@shared/types';
import { ApiError } from '../middlewares/error-handler';
import { parseCsvFile } from '../utils/csv-parser';
import path from 'path';
import fs from 'fs';

/**
 * Service handling survey-related operations
 */
export class SurveyService {
  /**
   * Get survey by ID
   * @param surveyId Survey ID
   * @returns Survey data with API response
   */
  static async getSurveyById(surveyId: number): Promise<ApiResponse<Survey>> {
    try {
      // In a real implementation, this would fetch from the database
      // For our implementation, we'll use a mock survey that represents what we'd get from the DB
      
      // Check if this is the standard AI readiness survey (ID 19)
      if (surveyId === 19) {
        const survey: Survey = {
          id: 19,
          title: 'AI Readiness Assessment',
          description: 'Evaluate your organization\'s readiness for AI adoption across key dimensions',
          fileReference: 'surveys/ai-readiness-survey.csv',
          teamId: null, // Global survey
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        };
        
        return {
          success: true,
          data: survey
        };
      }
      
      // If not found, throw an error
      throw new ApiError(404, `Survey with ID ${surveyId} not found`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error getting survey:', error);
      throw new ApiError(500, 'Failed to retrieve survey');
    }
  }
  
  /**
   * Get questions for a survey
   * @param surveyId Survey ID
   * @returns Array of survey questions with API response
   */
  static async getSurveyQuestions(surveyId: number): Promise<ApiResponse<SurveyQuestion[]>> {
    try {
      // Get the survey to find the file reference
      const surveyResponse = await this.getSurveyById(surveyId);
      
      if (!surveyResponse.success || !surveyResponse.data) {
        throw new ApiError(404, `Survey with ID ${surveyId} not found`);
      }
      
      const survey = surveyResponse.data;
      
      // Determine the path to the CSV file
      const csvFilePath = path.resolve(process.cwd(), 'data', survey.fileReference);
      
      // Check if file exists
      if (!fs.existsSync(csvFilePath)) {
        throw new ApiError(404, `Survey file not found: ${survey.fileReference}`);
      }
      
      // Parse the CSV file to get questions
      const questions = parseCsvFile<SurveyQuestion>(csvFilePath, {
        headers: ['id', 'surveyId', 'questionNumber', 'text', 'category', 'subCategory', 'weight'],
        skipFirstRow: true,
        transform: (row) => ({
          id: parseInt(row.id),
          surveyId: surveyId,
          questionNumber: parseInt(row.questionNumber),
          text: row.text,
          category: row.category,
          subCategory: row.subCategory || undefined,
          weight: parseFloat(row.weight)
        })
      });
      
      // Sort questions by question number
      questions.sort((a, b) => a.questionNumber - b.questionNumber);
      
      return {
        success: true,
        data: questions
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error getting survey questions:', error);
      throw new ApiError(500, 'Failed to retrieve survey questions');
    }
  }
  
  /**
   * Create a new survey
   * @param data Survey creation data
   * @returns The created survey
   */
  static async createSurvey(data: CreateSurveyInput): Promise<ApiResponse<Survey>> {
    try {
      // In a real implementation, this would insert into the database
      // For now, we'll just return a mock response
      
      const survey: Survey = {
        id: Math.floor(Math.random() * 1000) + 100, // Mock ID
        ...data,
        fileReference: data.fileReference || 'surveys/default-survey.csv',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        message: 'Survey created successfully',
        data: survey
      };
    } catch (error) {
      console.error('Error creating survey:', error);
      throw new ApiError(500, 'Failed to create survey');
    }
  }
  
  /**
   * Update a survey
   * @param surveyId Survey ID to update
   * @param data Updated survey data
   * @returns The updated survey
   */
  static async updateSurvey(surveyId: number, data: CreateSurveyInput): Promise<ApiResponse<Survey>> {
    try {
      // In a real implementation, this would update the database
      // For now, we'll simulate the operation
      
      // First check if the survey exists
      const existingResponse = await this.getSurveyById(surveyId);
      
      if (!existingResponse.success || !existingResponse.data) {
        throw new ApiError(404, `Survey with ID ${surveyId} not found`);
      }
      
      const existing = existingResponse.data;
      
      // Update the survey
      const updated: Survey = {
        ...existing,
        ...data,
        updatedAt: new Date()
      };
      
      return {
        success: true,
        message: 'Survey updated successfully',
        data: updated
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating survey:', error);
      throw new ApiError(500, 'Failed to update survey');
    }
  }
  
  /**
   * Delete a survey
   * @param surveyId Survey ID to delete
   * @returns Success response
   */
  static async deleteSurvey(surveyId: number): Promise<ApiResponse<null>> {
    try {
      // In a real implementation, this would delete from the database
      // For now, we'll simulate the operation
      
      // First check if the survey exists
      const existingResponse = await this.getSurveyById(surveyId);
      
      if (!existingResponse.success) {
        throw new ApiError(404, `Survey with ID ${surveyId} not found`);
      }
      
      // Protected surveys cannot be deleted
      if (surveyId === 19) {
        throw new ApiError(403, 'Cannot delete system survey');
      }
      
      return {
        success: true,
        message: 'Survey deleted successfully'
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error deleting survey:', error);
      throw new ApiError(500, 'Failed to delete survey');
    }
  }
}