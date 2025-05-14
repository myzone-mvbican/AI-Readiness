import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { SurveyController } from './controllers/survey-controller';
import { AssessmentController } from './controllers/assessment-controller';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';

/**
 * Register API routes with Express app
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router
  const apiRouter = express.Router();
  
  // Survey routes
  apiRouter.get('/surveys/:id', SurveyController.getSurveyById);
  apiRouter.get('/surveys/:id/questions', SurveyController.getSurveyQuestions);
  apiRouter.post('/surveys', SurveyController.createSurvey);
  apiRouter.put('/surveys/:id', SurveyController.updateSurvey);
  apiRouter.delete('/surveys/:id', SurveyController.deleteSurvey);
  
  // Assessment routes
  apiRouter.post('/assessments', AssessmentController.createAssessment);
  apiRouter.get('/assessments/:id', AssessmentController.getAssessmentById);
  apiRouter.get('/assessments/:id/answers', AssessmentController.getAssessmentAnswers);
  apiRouter.post('/assessments/:id/answers', AssessmentController.saveAssessmentAnswers);
  apiRouter.post('/assessments/:id/complete', AssessmentController.completeAssessment);
  
  // Guest user route
  apiRouter.post('/guest-users', AssessmentController.createGuestUser);
  
  // Register the API router
  app.use('/api', apiRouter);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}