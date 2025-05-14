import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment-service';
import { ApiError } from '../middlewares/error-handler';
import { AssessmentAnswer } from '../../shared/types';

/**
 * Controller for assessment-related endpoints
 */
export class AssessmentController {
  /**
   * Create a new assessment
   */
  static async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, surveyId, userId, guestData } = req.body;
      
      if (!title) {
        throw ApiError.badRequest('Title is required');
      }
      
      if (!surveyId || isNaN(parseInt(surveyId))) {
        throw ApiError.badRequest('Valid survey ID is required');
      }
      
      const response = await AssessmentService.createAssessment({
        title,
        surveyId: parseInt(surveyId),
        userId,
        guestData
      });
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get assessment by ID
   */
  static async getAssessmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = parseInt(req.params.id);
      
      if (isNaN(assessmentId)) {
        throw ApiError.badRequest('Invalid assessment ID');
      }
      
      const response = await AssessmentService.getAssessmentById(assessmentId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get assessment answers
   */
  static async getAssessmentAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = parseInt(req.params.id);
      
      if (isNaN(assessmentId)) {
        throw ApiError.badRequest('Invalid assessment ID');
      }
      
      const response = await AssessmentService.getAssessmentAnswers(assessmentId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Save assessment answers
   */
  static async saveAssessmentAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (isNaN(assessmentId)) {
        throw ApiError.badRequest('Invalid assessment ID');
      }
      
      if (!Array.isArray(answers)) {
        throw ApiError.badRequest('Answers must be an array');
      }
      
      const response = await AssessmentService.saveAssessmentAnswers(
        assessmentId,
        answers as AssessmentAnswer[]
      );
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create guest user
   */
  static async createGuestUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, company } = req.body;
      
      if (!name) {
        throw ApiError.badRequest('Name is required');
      }
      
      if (!email) {
        throw ApiError.badRequest('Email is required');
      }
      
      const response = await AssessmentService.createGuestUser({
        name,
        email,
        company
      });
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Complete an assessment
   */
  static async completeAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessmentId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (isNaN(assessmentId)) {
        throw ApiError.badRequest('Invalid assessment ID');
      }
      
      if (!Array.isArray(answers)) {
        throw ApiError.badRequest('Answers must be an array');
      }
      
      const response = await AssessmentService.completeAssessment(
        assessmentId,
        answers as AssessmentAnswer[]
      );
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}