import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessment-service';
import { AssessmentAnswer } from '../../shared/types';

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
    
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format',
        error: {
          code: 'BAD_REQUEST',
          message: 'Answers must be an array'
        }
      });
    }
    
    const typedAnswers: AssessmentAnswer[] = answers.map((a: any) => ({
      q: a.q !== undefined ? Number(a.q) : null,
      a: a.a !== undefined ? Number(a.a) : null
    }));
    
    const result = await AssessmentService.saveAnswers(assessmentId, typedAnswers);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  /**
   * Complete an assessment
   */
  static async completeAssessment(req: Request, res: Response) {
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
    
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format',
        error: {
          code: 'BAD_REQUEST',
          message: 'Answers must be an array'
        }
      });
    }
    
    const typedAnswers: AssessmentAnswer[] = answers.map((a: any) => ({
      q: a.q !== undefined ? Number(a.q) : null,
      a: a.a !== undefined ? Number(a.a) : null
    }));
    
    const result = await AssessmentService.completeAssessment(assessmentId, typedAnswers);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  }
}