import { AssessmentRepository } from "../repositories/assessment.repository";
import { SurveyService } from "./survey.service";
import { UserService } from "./user.service";
import { CompletionService } from "./completion.service";
import { ValidationError, NotFoundError, ForbiddenError, InternalServerError } from "../utils/errors";
import { getScore, formatDate } from "@/lib/utils";

export interface CreateAssessmentData {
  surveyTemplateId: number;
  userId: number;
  title?: string;
  status?: string;
}

export interface CreateGuestAssessmentData {
  surveyTemplateId: number;
  guestData: any;
  answers: any[];
  status?: string;
}

export interface UpdateAssessmentData {
  title?: string;
  status?: string;
  answers?: any[];
  score?: number | null;
  recommendations?: string;
  pdfPath?: string | null;
  completedOn?: Date | null;
}

export interface AssessmentFilters {
  search?: string;
  status?: string;
  userId?: number;
}

export interface AssessmentPaginationOptions {
  page: number;
  pageSize: number;
  limit: number;
  search?: string;
  status?: string;
  userId?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CompletionCheckResult {
  canTake: boolean;
  completionCount: number;
  completionLimit: number | null;
  message?: string;
}

export class AssessmentService {
  private static assessmentRepository = new AssessmentRepository();

  /**
   * Parse and validate pagination parameters from request
   */
  static parsePaginationParams(req: any): {
    page: number;
    pageSize: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  } {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const sortBy = (req.query.sortBy as string) || "updatedAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    return {
      page,
      pageSize,
      search,
      status,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    };
  }

  /**
   * Get assessments for a user with pagination and filtering
   */
  static async getAssessmentsForUser(
    userId: number,
    options: AssessmentPaginationOptions
  ): Promise<any> {
    try {
      const repositoryOptions = {
        ...options,
        limit: options.pageSize
      };
      return await this.assessmentRepository.getByUserIdPaginated(userId, repositoryOptions);
    } catch (error: any) {
      throw new InternalServerError("Failed to retrieve assessments");
    }
  }

  /**
   * Get an assessment by ID
   */
  static async getAssessmentById(assessmentId: number): Promise<any> {
    try {
      const assessment = await this.assessmentRepository.getWithSurveyInfo(assessmentId);
      if (!assessment) {
        throw new NotFoundError("Assessment");
      }
      return assessment;
    } catch (error: any) {
      // Re-throw known error types as-is
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Preserve InternalServerError messages for better debugging
      if (error instanceof InternalServerError) {
        throw error;
      }
      // Log unexpected errors with context
      console.error(`Error retrieving assessment ${assessmentId}:`, error);
      throw new InternalServerError(
        error?.message || "Failed to retrieve assessment"
      );
    }
  }

  /**
   * Get assessment by ID with access control
   */
  static async getAssessmentByIdForUser(assessmentId: number, userId: number, userRole?: string): Promise<any> {
    try {
      const assessment = await this.assessmentRepository.getWithSurveyInfo(assessmentId);
      if (!assessment) {
        throw new NotFoundError("Assessment");
      }

      // Check access: user owns assessment or is admin
      if (assessment.userId !== userId && userRole !== "admin") {
        throw new ForbiddenError("You do not have permission to access this assessment");
      }

      return assessment;
    } catch (error: any) {
      // Re-throw known error types as-is
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      // Preserve InternalServerError messages for better debugging
      if (error instanceof InternalServerError) {
        throw error;
      }
      // Log unexpected errors with context
      console.error(`Error retrieving assessment ${assessmentId} for user ${userId}:`, error);
      throw new InternalServerError(
        error?.message || "Failed to retrieve assessment"
      );
    }
  }

  /**
   * Create a new assessment
   */
  static async createAssessment(
    assessmentData: CreateAssessmentData,
    userId: number
  ): Promise<any> {
    try {
      // Validate required fields
      if (!assessmentData.surveyTemplateId) {
        throw new ValidationError("Survey template ID is required");
      }

      // Get survey template
      const survey = await SurveyService.getById(assessmentData.surveyTemplateId);
      if (!survey) {
        throw new NotFoundError("Survey template not found");
      }

      // Check completion limits before creating assessment
      const completionCheck = await CompletionService.canUserTakeSurvey(
        assessmentData.surveyTemplateId,
        userId,
        undefined
      );

      if (!completionCheck.canTake) {
        throw new ValidationError(
          completionCheck.message || "You have reached the completion limit for this survey"
        );
      }

      // Create blank answers array
      const blankAnswers = Array.from(
        { length: survey.questionsCount },
        (_, i) => ({
          q: i + 1,
        })
      );

      const assessmentRecord = {
        title: assessmentData.title || `${survey.title} - ${formatDate(new Date())}`,
        surveyTemplateId: assessmentData.surveyTemplateId,
        userId: assessmentData.userId,
        status: assessmentData.status || "draft",
        answers: JSON.stringify(blankAnswers),
      };

      const newAssessment = await this.assessmentRepository.create(assessmentRecord);
      return newAssessment;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to create assessment");
    }
  }

  /**
   * Create a guest assessment
   */
  static async createGuestAssessment(
    assessmentData: CreateGuestAssessmentData
  ): Promise<any> {
    try {
      // Validate required fields
      if (!assessmentData.surveyTemplateId || !assessmentData.answers || !assessmentData.guestData) {
        throw new ValidationError("Survey template ID, answers, and guest data are required");
      }

      if (!Array.isArray(assessmentData.answers)) {
        throw new ValidationError("Answers must be an array");
      }

      // Get survey template
      const survey = await SurveyService.getById(assessmentData.surveyTemplateId);
      if (!survey) {
        throw new NotFoundError("Survey template not found");
      }

      // Validate that all questions are answered before allowing completion
      if (assessmentData.status === "completed" || !assessmentData.status) {
        if (!this.validateAllQuestionsAnswered(assessmentData.answers, survey)) {
          throw new ValidationError(
            "All questions must be answered before completing the assessment"
          );
        }
      }

      // Check completion limits for guest users
      const guestEmail = assessmentData.guestData?.email;
      if (guestEmail) {
        const completionCheck = await CompletionService.canUserTakeSurvey(
          assessmentData.surveyTemplateId,
          undefined,
          guestEmail
        );

        if (!completionCheck.canTake) {
          throw new ValidationError(
            completionCheck.message || "You have reached the completion limit for this survey"
          );
        }
      }

      // Create guest assessment
      const assessmentRecord = {
        title: `${survey.title} - ${formatDate(new Date())}`,
        surveyTemplateId: assessmentData.surveyTemplateId,
        userId: null, // null userId for guest assessments
        guest: JSON.stringify(assessmentData.guestData),
        answers: JSON.stringify(assessmentData.answers),
        completedOn: new Date(),
        status: assessmentData.status || "completed",
        score: getScore(assessmentData.answers),
      };

      const newAssessment = await this.assessmentRepository.create(assessmentRecord);
      
      // Add survey info to response
      return {
        ...newAssessment,
        survey: survey
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to create guest assessment");
    }
  }

  /**
   * Update an assessment
   */
  static async updateAssessment(
    assessmentId: number,
    updateData: UpdateAssessmentData,
    userId: number,
    isAdmin: boolean = false
  ): Promise<any> {
    try {
      // Get existing assessment
      const existingAssessment = await this.assessmentRepository.getById(assessmentId);
      if (!existingAssessment) {
        throw new NotFoundError("Assessment");
      }

      // Check if only updating recommendations (AI service update)
      const isUpdatingOnlyRecommendations = 
        Object.keys(updateData).length === 1 && 
        typeof updateData.recommendations === "string";

      // Check ownership (skip for AI updates)
      if (!isUpdatingOnlyRecommendations && existingAssessment.userId !== userId && !isAdmin) {
        throw new ForbiddenError("You do not have permission to update this assessment");
      }

      // Check if already completed (skip for AI updates)
      if (!isUpdatingOnlyRecommendations && existingAssessment.status === "completed") {
        throw new ValidationError("Cannot update a completed assessment");
      }

      // Check completion limits when trying to complete an assessment
      if (
        !isUpdatingOnlyRecommendations &&
        updateData.status === "completed" &&
        existingAssessment.status !== "completed"
      ) {
        const survey = await SurveyService.getById(existingAssessment.surveyTemplateId);
        
        // Validate that all questions are answered before allowing completion
        const answers = updateData.answers || JSON.parse(existingAssessment.answers);
        if (!this.validateAllQuestionsAnswered(answers, survey)) {
          throw new ValidationError(
            "All questions must be answered before completing the assessment"
          );
        }
        
        if (survey && survey.completionLimit) {
          const completionCheck = await CompletionService.canUserTakeSurvey(
            existingAssessment.surveyTemplateId,
            userId,
            undefined,
            assessmentId // Exclude current assessment from count
          );

          // Check if completing this assessment would exceed the limit
          if (completionCheck.completionCount + 1 > survey.completionLimit) {
            throw new ValidationError(
              `You have reached the completion limit for this survey (${completionCheck.completionCount + 1}/${survey.completionLimit})`
            );
          }
        }
      }

      // Calculate score if completing
      let score = null;
      let completedOn = updateData.completedOn;
      
      if (updateData.status === "completed" || existingAssessment.status === "completed") {
        let answers;
        if (updateData.answers) {
          answers = updateData.answers;
        } else {
          // Handle both parsed and unparsed answers
          if (Array.isArray(existingAssessment.answers)) {
            answers = existingAssessment.answers;
          } else if (typeof existingAssessment.answers === 'string') {
            answers = JSON.parse(existingAssessment.answers);
          } else {
            answers = [];
          }
        }
        score = getScore(answers);
        
        // Set completedOn if assessment is being completed and it wasn't already completed
        if (updateData.status === "completed" && existingAssessment.status !== "completed") {
          completedOn = new Date();
        }
      }

      // Preserve existing score if only updating recommendations
      if (isUpdatingOnlyRecommendations && existingAssessment.score) {
        score = existingAssessment.score;
      }

      const updatedData = {
        ...updateData,
        score,
        completedOn,
      };

      const updatedAssessment = await this.assessmentRepository.update(assessmentId, updatedData);
      return updatedAssessment;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError("Failed to update assessment");
    }
  }

  /**
   * Update guest assessment (restricted to recommendations only)
   */
  static async updateGuestAssessment(
    assessmentId: number,
    recommendations: string
  ): Promise<any> {
    try {
      // Validate required fields
      if (!recommendations) {
        throw new ValidationError("Recommendations are required");
      }

      // Get existing assessment
      const existingAssessment = await this.assessmentRepository.getWithSurveyInfo(assessmentId);
      if (!existingAssessment) {
        throw new NotFoundError("Assessment not found");
      }

      // Verify this is a guest assessment
      if (existingAssessment.userId !== null) {
        throw new ForbiddenError("This endpoint can only be used for guest assessments");
      }

      // Validate guest data exists
      if (!existingAssessment.guest) {
        throw new ForbiddenError("Invalid guest assessment - no guest data found");
      }

      // Update only recommendations
      const updatedAssessment = await this.assessmentRepository.update(assessmentId, {
        recommendations,
      });

      return updatedAssessment;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalServerError("Failed to update guest assessment");
    }
  }

  /**
   * Delete an assessment
   */
  static async deleteAssessment(assessmentId: number, userId: number): Promise<boolean> {
    try {
      // Get existing assessment
      const assessment = await this.assessmentRepository.getById(assessmentId);
      if (!assessment) {
        throw new NotFoundError("Assessment not found");
      }

      // Check ownership
      if (assessment.userId !== userId) {
        throw new ForbiddenError("You do not have permission to delete this assessment");
      }

      return await this.assessmentRepository.delete(assessmentId);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError("Failed to delete assessment");
    }
  }

  /**
   * Check completion eligibility for a survey
   */
  static async checkCompletionEligibility(
    surveyTemplateId: number,
    userId?: number,
    guestEmail?: string
  ): Promise<CompletionCheckResult> {
    try {
      return await CompletionService.canUserTakeSurvey(surveyTemplateId, userId, guestEmail);
    } catch (error: any) {
      throw new InternalServerError("Failed to check completion eligibility");
    }
  }

  /**
   * Get assessment statistics for a user
   */
  static async getAssessmentStats(userId: number): Promise<{
    total: number;
    completed: number;
    draft: number;
    averageScore: number | null;
  }> {
    try {
      const assessments = await this.assessmentRepository.getAll({ userId });
      
      const total = assessments.length;
      const completed = assessments.filter(a => a.status === "completed").length;
      const draft = assessments.filter(a => a.status === "draft").length;
      
      const completedWithScores = assessments.filter(a => a.status === "completed" && a.score !== null);
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, a) => sum + (a.score || 0), 0) / completedWithScores.length
        : null;

      return {
        total,
        completed,
        draft,
        averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null
      };
    } catch (error: any) {
      throw new InternalServerError("Failed to get assessment statistics");
    }
  }

  /**
   * Validate that all questions are answered
   */
  private static validateAllQuestionsAnswered(answers: any[], survey: any): boolean {
    if (!survey || !survey.questions || !Array.isArray(survey.questions)) {
      return false;
    }

    const totalQuestions = survey.questions.length;
    const answeredQuestions = answers.filter(answer => 
      answer && 
      typeof answer === 'object' && 
      answer.a !== null && 
      answer.a !== undefined && 
      answer.a !== ''
    ).length;

    return answeredQuestions === totalQuestions;
  }
}
