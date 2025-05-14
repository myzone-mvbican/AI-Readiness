import {
  ApiResponse,
  Assessment,
  AssessmentAnswer,
  AssessmentStatus,
  CreateAssessmentInput,
  GuestUser
} from '@shared/types';
import { ApiError } from '../middlewares/error-handler';
import { v4 as uuidv4 } from 'uuid';
import { SurveyService } from './survey-service';

/**
 * Service handling assessment-related operations
 */
export class AssessmentService {
  /**
   * Create a new draft assessment
   * @param data Assessment creation data
   * @returns The created assessment with API response
   */
  static async createAssessment(data: CreateAssessmentInput): Promise<ApiResponse<Assessment>> {
    try {
      // Validate survey exists
      const surveyResponse = await SurveyService.getSurveyById(data.surveyId);
      
      if (!surveyResponse.success || !surveyResponse.data) {
        throw new ApiError(404, `Survey with ID ${data.surveyId} not found`);
      }
      
      // In a real implementation, this would insert into the database
      // For now, we'll return a mock assessment 
      const assessment: Assessment = {
        id: Math.floor(Math.random() * 1000) + 100, // Mock ID
        title: data.title,
        surveyId: data.surveyId,
        userId: data.userId,
        guestData: data.guestData,
        status: AssessmentStatus.DRAFT,
        progress: 0,
        score: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null
      };
      
      return {
        success: true,
        message: 'Assessment created successfully',
        data: assessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error creating assessment:', error);
      throw new ApiError(500, 'Failed to create assessment');
    }
  }
  
  /**
   * Get assessment by ID
   * @param assessmentId Assessment ID
   * @returns The assessment with API response
   */
  static async getAssessmentById(assessmentId: number): Promise<ApiResponse<Assessment>> {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll simulate a mock response
      
      // This is a mock assessment that would normally come from the database
      const assessment: Assessment = {
        id: assessmentId,
        title: 'AI Readiness Assessment',
        surveyId: 19, // Standard AI readiness survey
        userId: null, // Guest assessment
        guestData: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        status: AssessmentStatus.IN_PROGRESS,
        progress: 30,
        score: null,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        completedAt: null
      };
      
      return {
        success: true,
        data: assessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error fetching assessment:', error);
      throw new ApiError(500, 'Failed to retrieve assessment');
    }
  }
  
  /**
   * Get assessment answers
   * @param assessmentId Assessment ID
   * @returns Array of assessment answers with API response
   */
  static async getAssessmentAnswers(assessmentId: number): Promise<ApiResponse<AssessmentAnswer[]>> {
    try {
      // Ensure assessment exists
      const assessmentResponse = await this.getAssessmentById(assessmentId);
      
      if (!assessmentResponse.success || !assessmentResponse.data) {
        throw new ApiError(404, `Assessment with ID ${assessmentId} not found`);
      }
      
      // In a real implementation, this would fetch from the database
      // For now, we'll return sample answers
      const answers: AssessmentAnswer[] = [
        { assessmentId, q: 1, a: 1 },
        { assessmentId, q: 2, a: 0 },
        { assessmentId, q: 3, a: 2 },
        { assessmentId, q: 4, a: -1 },
        { assessmentId, q: 5, a: null }
      ];
      
      return {
        success: true,
        data: answers
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error fetching assessment answers:', error);
      throw new ApiError(500, 'Failed to retrieve assessment answers');
    }
  }
  
  /**
   * Save assessment answers
   * @param assessmentId Assessment ID
   * @param answers Array of assessment answers
   * @returns Success response
   */
  static async saveAssessmentAnswers(
    assessmentId: number,
    answers: Omit<AssessmentAnswer, 'assessmentId'>[]
  ): Promise<ApiResponse<Assessment>> {
    try {
      // Ensure assessment exists
      const assessmentResponse = await this.getAssessmentById(assessmentId);
      
      if (!assessmentResponse.success || !assessmentResponse.data) {
        throw new ApiError(404, `Assessment with ID ${assessmentId} not found`);
      }
      
      const assessment = assessmentResponse.data;
      
      // Make sure assessment is not completed
      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw new ApiError(400, 'Cannot modify a completed assessment');
      }
      
      // Update progress based on answers
      const totalAnswered = answers.filter(a => a.a !== null).length;
      
      // Get the total number of questions from survey
      const surveyResponse = await SurveyService.getSurveyQuestions(assessment.surveyId);
      
      if (!surveyResponse.success || !surveyResponse.data) {
        throw new ApiError(500, 'Failed to retrieve survey questions');
      }
      
      const totalQuestions = surveyResponse.data.length;
      const progress = Math.round((totalAnswered / totalQuestions) * 100);
      
      // In a real implementation, this would update the database
      // For now, we'll just return the updated assessment
      const updatedAssessment: Assessment = {
        ...assessment,
        status: AssessmentStatus.IN_PROGRESS,
        progress,
        updatedAt: new Date()
      };
      
      return {
        success: true,
        message: 'Answers saved successfully',
        data: updatedAssessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error saving assessment answers:', error);
      throw new ApiError(500, 'Failed to save assessment answers');
    }
  }
  
  /**
   * Create guest user
   * @param data Guest user data
   * @returns The created guest user with API response
   */
  static async createGuestUser(data: {
    name: string;
    email: string;
    company?: string;
  }): Promise<ApiResponse<GuestUser>> {
    try {
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        throw new ApiError(400, 'Name is required');
      }
      
      if (!data.email || !data.email.trim()) {
        throw new ApiError(400, 'Email is required');
      }
      
      // Create a new guest user
      const guestUser: GuestUser = {
        id: uuidv4(), // Generate UUID for guest user
        name: data.name.trim(),
        email: data.email.trim(),
        company: data.company ? data.company.trim() : undefined,
        createdAt: new Date()
      };
      
      return {
        success: true,
        message: 'Guest user created successfully',
        data: guestUser
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error creating guest user:', error);
      throw new ApiError(500, 'Failed to create guest user');
    }
  }
  
  /**
   * Complete an assessment
   * @param assessmentId Assessment ID
   * @returns The completed assessment with API response
   */
  static async completeAssessment(
    assessmentId: number
  ): Promise<ApiResponse<Assessment>> {
    try {
      // Ensure assessment exists
      const assessmentResponse = await this.getAssessmentById(assessmentId);
      
      if (!assessmentResponse.success || !assessmentResponse.data) {
        throw new ApiError(404, `Assessment with ID ${assessmentId} not found`);
      }
      
      const assessment = assessmentResponse.data;
      
      // Get answers to calculate score
      const answersResponse = await this.getAssessmentAnswers(assessmentId);
      
      if (!answersResponse.success || !answersResponse.data) {
        throw new ApiError(500, 'Failed to retrieve assessment answers');
      }
      
      const answers = answersResponse.data;
      
      // Calculate the score
      const score = this.calculateScore(answers);
      
      // Update the assessment
      const updatedAssessment: Assessment = {
        ...assessment,
        status: AssessmentStatus.COMPLETED,
        progress: 100,
        score,
        completedAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        message: 'Assessment completed successfully',
        data: updatedAssessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error completing assessment:', error);
      throw new ApiError(500, 'Failed to complete assessment');
    }
  }
  
  /**
   * Calculate assessment score from answers
   * @param answers Array of assessment answers
   * @returns The calculated score (0-100)
   */
  private static calculateScore(answers: AssessmentAnswer[]): number {
    // Filter out null answers
    const validAnswers = answers.filter(a => a.a !== null);
    
    if (validAnswers.length === 0) {
      return 0;
    }
    
    // Calculate raw score based on answer values
    // Convert from -2 to 2 scale to 0 to 4 scale
    const totalPossiblePoints = validAnswers.length * 4; // Each question is worth 4 points max
    const earnedPoints = validAnswers.reduce((sum, answer) => {
      // Add 2 to convert from -2..2 range to 0..4 range
      return sum + ((answer.a || 0) + 2);
    }, 0);
    
    // Convert to percentage (0-100)
    return Math.round((earnedPoints / totalPossiblePoints) * 100);
  }
}