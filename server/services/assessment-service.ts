import { Assessment, AssessmentAnswer, ApiResponse, GuestUser } from '../../shared/types';
import { ApiError } from '../middlewares/error-handler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service handling assessment-related operations
 */
export class AssessmentService {
  /**
   * Create a new draft assessment
   * @param data Assessment creation data
   * @returns The created assessment with API response
   */
  static async createAssessment(data: {
    title: string;
    surveyId: number;
    userId?: string | null;
    guestData?: {
      name: string;
      email: string;
    };
  }): Promise<ApiResponse<Assessment>> {
    try {
      // Simulate creating assessment in database
      // In a real implementation, this would insert into the database
      const assessment: Assessment = {
        id: Math.floor(Math.random() * 10000),
        title: data.title,
        surveyId: data.surveyId,
        status: 'draft',
        score: null,
        userId: data.userId || null,
        guestEmail: data.guestData?.email || null,
        guestName: data.guestData?.name || null,
        company: null,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: assessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error creating assessment:', error);
      throw ApiError.serverError('Failed to create assessment');
    }
  }
  
  /**
   * Get assessment by ID
   * @param assessmentId Assessment ID
   * @returns The assessment with API response
   */
  static async getAssessmentById(assessmentId: number): Promise<ApiResponse<Assessment>> {
    try {
      // Simulate getting assessment from database
      // In a real implementation, this would query the database
      const assessment: Assessment = {
        id: assessmentId,
        title: "My AI Readiness Assessment",
        surveyId: 19, // Default survey ID for guest assessments
        status: 'in-progress',
        score: null,
        userId: null,
        guestEmail: null,
        guestName: null,
        company: null,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: assessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error getting assessment:', error);
      throw ApiError.serverError('Failed to get assessment data');
    }
  }
  
  /**
   * Get assessment answers
   * @param assessmentId Assessment ID
   * @returns Array of assessment answers with API response
   */
  static async getAssessmentAnswers(assessmentId: number): Promise<ApiResponse<AssessmentAnswer[]>> {
    try {
      // Simulate getting answers from database
      // In a real implementation, this would query the database
      const answers: AssessmentAnswer[] = [];
      
      return {
        success: true,
        data: answers
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error getting assessment answers:', error);
      throw ApiError.serverError('Failed to get assessment answers');
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
    answers: AssessmentAnswer[]
  ): Promise<ApiResponse<void>> {
    try {
      // Validate answers format
      if (!Array.isArray(answers)) {
        throw ApiError.badRequest('Answers must be an array');
      }
      
      for (const answer of answers) {
        if (typeof answer.q !== 'number' && answer.q !== null) {
          throw ApiError.badRequest('Question numbers must be numbers or null');
        }
        
        if (
          (answer.a !== -2 && answer.a !== -1 && answer.a !== 0 && answer.a !== 1 && answer.a !== 2 && answer.a !== null)
        ) {
          throw ApiError.badRequest('Answer values must be -2, -1, 0, 1, 2, or null');
        }
      }
      
      // Simulate saving answers to database
      // In a real implementation, this would insert/update the database
      
      return {
        success: true
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error saving assessment answers:', error);
      throw ApiError.serverError('Failed to save assessment answers');
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
      if (!data.name) {
        throw ApiError.badRequest('Name is required');
      }
      
      if (!data.email) {
        throw ApiError.badRequest('Email is required');
      }
      
      // Simulate creating guest user
      // In a real implementation, this might create a temporary user record
      const guestUser: GuestUser = {
        id: uuidv4(),
        name: data.name,
        email: data.email,
        company: data.company || null
      };
      
      return {
        success: true,
        data: guestUser
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error creating guest user:', error);
      throw ApiError.serverError('Failed to create guest user');
    }
  }
  
  /**
   * Complete an assessment
   * @param assessmentId Assessment ID
   * @returns The completed assessment with API response
   */
  static async completeAssessment(
    assessmentId: number,
    answers: AssessmentAnswer[]
  ): Promise<ApiResponse<Assessment>> {
    try {
      // Get assessment first
      const assessmentResponse = await this.getAssessmentById(assessmentId);
      
      if (!assessmentResponse.success || !assessmentResponse.data) {
        throw ApiError.notFound(`Assessment with ID ${assessmentId} not found`);
      }
      
      const assessment = assessmentResponse.data;
      
      // Calculate score based on answers
      const score = this.calculateScore(answers);
      
      // Update assessment status and score
      const updatedAssessment: Assessment = {
        ...assessment,
        status: 'completed',
        score,
        updatedAt: new Date()
      };
      
      // Simulate saving updated assessment
      // In a real implementation, this would update the database
      
      return {
        success: true,
        data: updatedAssessment
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error completing assessment:', error);
      throw ApiError.serverError('Failed to complete assessment');
    }
  }
  
  /**
   * Calculate assessment score from answers
   * @param answers Array of assessment answers
   * @returns The calculated score (0-100)
   */
  private static calculateScore(answers: AssessmentAnswer[]): number {
    // Filter out unanswered questions
    const answeredQuestions = answers.filter(a => a.a !== null);
    
    if (answeredQuestions.length === 0) {
      return 0;
    }
    
    // Transform answer values to a 0-4 scale
    // -2 => 0, -1 => 1, 0 => 2, 1 => 3, 2 => 4
    const transformedValues = answeredQuestions.map(a => {
      if (a.a === null) return 0;
      return a.a + 2;
    });
    
    // Calculate total score
    const maxPossibleScore = answeredQuestions.length * 4; // 4 is the max transformed value (from +2)
    const actualScore = transformedValues.reduce((sum, val) => sum + val, 0);
    
    // Convert to percentage
    return Math.round((actualScore / maxPossibleScore) * 100);
  }
}