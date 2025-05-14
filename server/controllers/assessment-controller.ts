import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessment-service';
import { AssessmentAnswer } from '../../shared/types';
import { createAssessmentSchema, updateAssessmentAnswersSchema } from '../../shared/validation/schemas';
import { ApiError } from '../middlewares/error-handler';

/**
 * Helper function to validate and convert assessment answers
 */
function validateAndConvertAnswers(answers: any[]): AssessmentAnswer[] {
  if (!Array.isArray(answers)) {
    throw ApiError.badRequest('Answers must be an array');
  }
  
  return answers.map((a) => {
    const questionId = a.q !== undefined ? Number(a.q) : null;
    const answerValue = a.a !== undefined ? Number(a.a) : null;
    
    // Validate the answer value is one of the allowed values
    if (answerValue !== null && 
        answerValue !== -2 && 
        answerValue !== -1 && 
        answerValue !== 0 && 
        answerValue !== 1 && 
        answerValue !== 2) {
      throw ApiError.badRequest(`Invalid answer value: ${answerValue}. Must be -2, -1, 0, 1, 2, or null.`);
    }
    
    return {
      q: questionId,
      a: answerValue as -2 | -1 | 0 | 1 | 2 | null
    };
  });
}

/**
 * Controller for assessment-related routes
 */
export class AssessmentController {
  /**
   * Get assessment by ID
   */
  static async getAssessmentById(req: Request, res: Response) {
    const assessmentId = parseInt(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID',
        error: {
          code: 'BAD_REQUEST',
          message: 'Assessment ID must be a number'
        }
      });
    }
    
    const result = await AssessmentService.getAssessmentById(assessmentId);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
    }
  }

  /**
   * Create a new assessment
   */
  static async createAssessment(req: Request, res: Response) {
    const { surveyId, userId, guestData } = req.body;
    
    if (!surveyId || isNaN(parseInt(surveyId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
        error: {
          code: 'BAD_REQUEST',
          message: 'Survey ID must be a number'
        }
      });
    }
    
    const result = await AssessmentService.createAssessment(
      parseInt(surveyId),
      userId || null,
      guestData
    );
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  /**
   * Save assessment answers
   */
  static async saveAnswers(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID',
          error: {
            code: 'BAD_REQUEST',
            message: 'Assessment ID must be a number'
          }
        });
      }
      
      // Validate and convert answers
      const typedAnswers = validateAndConvertAnswers(answers);
      
      // Call service to save answers
      const result = await AssessmentService.saveAnswers(assessmentId, typedAnswers);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save assessment answers',
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  /**
   * Complete an assessment
   */
  static async completeAssessment(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (isNaN(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID',
          error: {
            code: 'BAD_REQUEST',
            message: 'Assessment ID must be a number'
          }
        });
      }
      
      // Validate and convert answers
      const typedAnswers = validateAndConvertAnswers(answers);
      
      // Call service to complete assessment
      const result = await AssessmentService.completeAssessment(assessmentId, typedAnswers);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(result.error?.code === 'NOT_FOUND' ? 404 : 500).json(result);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to complete assessment',
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
}