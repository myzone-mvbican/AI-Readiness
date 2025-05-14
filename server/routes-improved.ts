import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { SurveyController } from './controllers/survey-controller';
import { AssessmentController } from './controllers/assessment-controller';
import { errorHandler, notFoundHandler, ApiError } from './middlewares/error-handler';

// Authentication middleware
import { authenticate, requireAdmin } from './middleware/auth';

/**
 * Register API routes with Express app
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // ===================================
  // Global Middleware
  // ===================================
  
  // CORS is already set up in the original routes
  
  // ===================================
  // Health Check
  // ===================================
  app.get('/api/health', (req, res) => {
    res.json({ 
      success: true, 
      status: 'ok', 
      message: 'Server is healthy',
      version: '1.0.0'
    });
  });
  
  // ===================================
  // Survey Routes (Public)
  // ===================================
  
  // Get survey by ID (public)
  app.get('/api/public/surveys/:id', SurveyController.getSurveyById);
  
  // Get survey questions
  app.get('/api/public/surveys/:id/questions', SurveyController.getSurveyQuestions);
  
  // ===================================
  // Survey Routes (Protected)
  // ===================================
  
  // Get all surveys (requires authentication)
  app.get('/api/surveys', authenticate, SurveyController.getAllSurveys);
  
  // Get survey by ID (with access control)
  app.get('/api/surveys/:id', authenticate, SurveyController.getSurveyById);
  
  // ===================================
  // Assessment Routes (Public)
  // ===================================
  
  // Create guest assessment
  app.post('/api/public/assessments', AssessmentController.createAssessment);
  
  // ===================================
  // Assessment Routes (Protected)
  // ===================================
  
  // Get all assessments for current user
  app.get('/api/assessments', authenticate, AssessmentController.getAssessmentById);
  
  // Get assessment by ID
  app.get('/api/assessments/:id', authenticate, AssessmentController.getAssessmentById);
  
  // Create new assessment
  app.post('/api/assessments', authenticate, AssessmentController.createAssessment);
  
  // Save assessment answers
  app.patch('/api/assessments/:id', authenticate, AssessmentController.saveAnswers);
  
  // Complete assessment
  app.post('/api/assessments/:id/complete', authenticate, AssessmentController.completeAssessment);
  
  // ===================================
  // Error Handling
  // ===================================
  
  // Not found handler for undefined routes
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);
  
  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}