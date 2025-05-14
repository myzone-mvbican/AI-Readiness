import { Request, Response, NextFunction } from 'express';
import { SurveyService } from '../services/survey-service';
import { ApiError } from '../middlewares/error-handler';

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
        throw ApiError.badRequest('Invalid survey ID');
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
        throw ApiError.badRequest('Invalid survey ID');
      }
      
      const response = await SurveyService.getSurveyQuestions(surveyId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}