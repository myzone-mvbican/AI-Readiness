import { Request, Response } from 'express';
import { SurveyService } from '../services/survey-service';

/**
 * Controller for survey-related routes
 */
export class SurveyController {
  /**
   * Get all surveys
   */
  static async getAllSurveys(req: Request, res: Response) {
    const result = await SurveyService.getAllSurveys();
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
    }
  }

  /**
   * Get survey by ID
   */
  static async getSurveyById(req: Request, res: Response) {
    const surveyId = parseInt(req.params.id);
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
        error: {
          code: 'BAD_REQUEST',
          message: 'Survey ID must be a number'
        }
      });
    }
    
    const result = await SurveyService.getSurveyById(surveyId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
    }
  }

  /**
   * Get questions for a survey
   */
  static async getSurveyQuestions(req: Request, res: Response) {
    const surveyId = parseInt(req.params.id);
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
        error: {
          code: 'BAD_REQUEST',
          message: 'Survey ID must be a number'
        }
      });
    }
    
    const result = await SurveyService.getSurveyQuestions(surveyId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
    }
  }
}