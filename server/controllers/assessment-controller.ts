import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment-service';
import { ApiError } from '../middlewares/error-handler';
import { createAssessmentSchema, saveAnswersSchema } from '@shared/types';

/**
 * Controller for assessment-related endpoints
 */
export class AssessmentController {
  /**
   * Create a new assessment
   */
  static async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body against schema
      const validatedData = createAssessmentSchema.parse(req.body);
      
      // For authenticated requests, add the user ID from session
      if (req.user && !validatedData.userId) {
        validatedData.userId = req.user.id;
      }
      
      // Pass to service
      const response = await AssessmentService.createAssessment(validatedData);
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
        throw new ApiError(400, 'Invalid assessment ID');
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
        throw new ApiError(400, 'Invalid assessment ID');
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
      
      if (isNaN(assessmentId)) {
        throw new ApiError(400, 'Invalid assessment ID');
      }
      
      // Validate request body against schema
      const { answers } = saveAnswersSchema.parse(req.body);
      
      // Pass to service
      const response = await AssessmentService.saveAssessmentAnswers(assessmentId, answers);
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
      
      if (!name || !email) {
        throw new ApiError(400, 'Name and email are required');
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError(400, 'Invalid email format');
      }
      
      // Pass to service
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
      
      if (isNaN(assessmentId)) {
        throw new ApiError(400, 'Invalid assessment ID');
      }
      
      const response = await AssessmentService.completeAssessment(assessmentId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}