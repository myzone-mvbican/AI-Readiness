import { Survey, SurveyQuestion, ApiResponse } from '../../shared/types';
import { parseCsvQuestions } from '../utils/csv-parser';
import { ApiError } from '../middlewares/error-handler';

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
      // Simulate getting survey from database
      // In a real implementation, this would query the database
      const survey: Survey = {
        id: surveyId,
        title: "AI Readiness Assessment",
        description: "Evaluate your organization's readiness for AI implementation",
        fileReference: `survey-1746935101248-725671443.csv`,
        questionCount: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: survey
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error getting survey:', error);
      throw ApiError.serverError('Failed to get survey data');
    }
  }
  
  /**
   * Get questions for a survey
   * @param surveyId Survey ID
   * @returns Array of survey questions with API response
   */
  static async getSurveyQuestions(surveyId: number): Promise<ApiResponse<SurveyQuestion[]>> {
    try {
      // First get the survey to get the file reference
      const surveyResponse = await this.getSurveyById(surveyId);
      
      if (!surveyResponse.success || !surveyResponse.data) {
        throw ApiError.notFound(`Survey with ID ${surveyId} not found`);
      }
      
      const survey = surveyResponse.data;
      
      if (!survey.fileReference) {
        throw ApiError.badRequest(`Survey ${surveyId} has no associated question file`);
      }
      
      // Parse the CSV to get questions
      const questions = await parseCsvQuestions(survey.fileReference);
      
      return {
        success: true,
        data: questions
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error getting survey questions:', error);
      throw ApiError.serverError('Failed to get survey questions');
    }
  }
}