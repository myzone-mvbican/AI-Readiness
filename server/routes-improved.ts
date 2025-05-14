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
  // Public Survey APIs
  // ===================================
  
  // Get survey details by ID
  app.get('/api/public/surveys/detail/:id', SurveyController.getSurveyById);
  
  // Get survey questions
  app.get('/api/public/surveys/:id/questions', SurveyController.getSurveyQuestions);
  
  // ===================================
  // Public Assessment APIs
  // ===================================
  
  // Create guest user
  app.post('/api/public/guest-user', AssessmentController.createGuestUser);
  
  // Create assessment (guest)
  app.post('/api/public/assessments', AssessmentController.createAssessment);
  
  // Get assessment
  app.get('/api/public/assessments/:id', AssessmentController.getAssessmentById);
  
  // Get assessment answers
  app.get('/api/public/assessments/:id/answers', AssessmentController.getAssessmentAnswers);
  
  // Save assessment answers
  app.post('/api/public/assessments/:id/answers', AssessmentController.saveAssessmentAnswers);
  
  // Complete assessment
  app.post('/api/public/assessments/:id/complete', AssessmentController.completeAssessment);
  
  // ===================================
  // Protected Routes - authentication required
  // ===================================
  
  // Get survey details by ID (authenticated)
  app.get('/api/surveys/detail/:id', authenticate, SurveyController.getSurveyById);
  
  // Get survey questions (authenticated)
  app.get('/api/surveys/:id/questions', authenticate, SurveyController.getSurveyQuestions);
  
  // Create assessment (authenticated)
  app.post('/api/assessments', authenticate, AssessmentController.createAssessment);
  
  // Get assessment (authenticated)
  app.get('/api/assessments/:id', authenticate, AssessmentController.getAssessmentById);
  
  // Get assessment answers (authenticated)
  app.get('/api/assessments/:id/answers', authenticate, AssessmentController.getAssessmentAnswers);
  
  // Save assessment answers (authenticated)
  app.post('/api/assessments/:id/answers', authenticate, AssessmentController.saveAssessmentAnswers);
  
  // Complete assessment (authenticated)
  app.post('/api/assessments/:id/complete', authenticate, AssessmentController.completeAssessment);
  
  // ===================================
  // Error Handling Middleware
  // ===================================
  
  // Not found handler for undefined routes
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);
  
  // Create and return HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
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