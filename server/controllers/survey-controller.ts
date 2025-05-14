import { Request, Response, NextFunction } from 'express';
import { SurveyService } from '../services/survey-service';
import { ApiError } from '../middlewares/error-handler';
import { createSurveySchema } from '@shared/types';

/**
 * Controller for survey-related endpoints
 */
export class SurveyController {
  /**
   * Get survey by ID
   */
  static async getSurveyById(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = parseInt(req.params.id);
      
      if (isNaN(surveyId)) {
        throw new ApiError(400, 'Invalid survey ID');
      }
      
      const response = await SurveyService.getSurveyById(surveyId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get questions for a survey
   */
  static async getSurveyQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = parseInt(req.params.id);
      
      if (isNaN(surveyId)) {
        throw new ApiError(400, 'Invalid survey ID');
      }
      
      const response = await SurveyService.getSurveyQuestions(surveyId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new survey
   */
  static async createSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body against schema
      const validatedData = createSurveySchema.parse(req.body);
      
      // Pass to service
      const response = await SurveyService.createSurvey(validatedData);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a survey
   */
  static async updateSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = parseInt(req.params.id);
      
      if (isNaN(surveyId)) {
        throw new ApiError(400, 'Invalid survey ID');
      }
      
      // Validate request body against schema
      const validatedData = createSurveySchema.parse(req.body);
      
      // Pass to service
      const response = await SurveyService.updateSurvey(surveyId, validatedData);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a survey
   */
  static async deleteSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const surveyId = parseInt(req.params.id);
      
      if (isNaN(surveyId)) {
        throw new ApiError(400, 'Invalid survey ID');
      }
      
      const response = await SurveyService.deleteSurvey(surveyId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}