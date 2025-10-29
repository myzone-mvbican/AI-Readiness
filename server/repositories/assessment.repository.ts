import { db } from "../db";
import { assessments } from "@shared/schema";
import { eq, and, or, desc, asc, like, sql, isNull } from "drizzle-orm";
import { BaseRepository, PaginationOptions, PaginatedResult } from "./base.repository";
import { SurveyService } from "../services/survey.service";

export interface Assessment {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number | null;
  guest: string | null;
  status: string;
  surveyTemplateId: number;
  score: number | null;
  answers: string;
  recommendations: string | null;
  pdfPath: string | null;
  completedOn: Date | null;
}

export interface AssessmentWithSurvey extends Assessment {
  survey: {
    id: number;
    title: string;
    questionsCount: number;
    completionLimit: number | null;
    questions: any[]; // Array of CsvQuestion objects
  };
}

export interface AssessmentFilters {
  search?: string;
  status?: string;
  userId?: number;
}

export interface AssessmentPaginationOptions extends PaginationOptions {
  search?: string;
  status?: string;
  userId?: number;
}

export class AssessmentRepository implements BaseRepository<Assessment> {
  constructor(private drizzleDb = db) {}

  async create(data: any, tx?: any): Promise<Assessment> {
    const db = tx || this.drizzleDb;
    
    // Handle answers serialization if it's an array
    const createData = { ...data };
    if (createData.answers && Array.isArray(createData.answers)) {
      createData.answers = JSON.stringify(createData.answers);
    }
    
    const [assessment] = await db.insert(assessments).values(createData).returning();
    
    // Parse answers
    let parsedAnswers;
    // Check if answers is already an array (no parsing needed)
    if (Array.isArray(assessment.answers)) {
      parsedAnswers = assessment.answers;
    } else if (typeof assessment.answers === 'string') {
      // Parse the JSON string
      parsedAnswers = JSON.parse(assessment.answers);
      
      // Handle malformed object structure where keys are JSON strings
      if (parsedAnswers && typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
        // Convert object with JSON string keys to array
        const answerArray = [];
        for (const key in parsedAnswers) {
          const parsedKey = JSON.parse(key);
          if (parsedKey && typeof parsedKey === 'object') {
            answerArray.push(parsedKey);
          }
        }
        parsedAnswers = answerArray;
      }
    } else {
      // If it's not a string or array, default to empty array
      parsedAnswers = [];
    }

    return {
      ...assessment,
      answers: parsedAnswers
    };
  }

  async getById(id: number, tx?: any): Promise<Assessment | null> {
    const db = tx || this.drizzleDb;
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);
    
    if (!assessment) return null;

    // Parse answers
    let parsedAnswers;
    // Check if answers is already an array (no parsing needed)
    if (Array.isArray(assessment.answers)) {
      parsedAnswers = assessment.answers;
    } else if (typeof assessment.answers === 'string') {
      // Parse the JSON string
      parsedAnswers = JSON.parse(assessment.answers);
      
      // Handle malformed object structure where keys are JSON strings
      if (parsedAnswers && typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
        // Convert object with JSON string keys to array
        const answerArray = [];
        for (const key in parsedAnswers) {
          const parsedKey = JSON.parse(key);
          if (parsedKey && typeof parsedKey === 'object') {
            answerArray.push(parsedKey);
          }
        }
        parsedAnswers = answerArray;
      }
    } else {
      // If it's not a string or array, default to empty array
      parsedAnswers = [];
    }

    return {
      ...assessment,
      answers: parsedAnswers
    };
  }

  async update(id: number, data: any, tx?: any): Promise<Assessment> {
    const db = tx || this.drizzleDb;
    
    // Handle answers serialization if it's an array
    const updateData = { ...data };
    if (updateData.answers && Array.isArray(updateData.answers)) {
      updateData.answers = JSON.stringify(updateData.answers);
    }
    
    const [updatedAssessment] = await db
      .update(assessments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();

    // Parse answers with error handling
    let parsedAnswers;
    try {
      parsedAnswers = JSON.parse(updatedAssessment.answers);
    } catch (error) {
      console.error("Error parsing assessment answers:", error);
      parsedAnswers = updatedAssessment.answers;
    }

    return {
      ...updatedAssessment,
      answers: parsedAnswers
    };
  }

  async delete(id: number, tx?: any): Promise<boolean> {
    const db = tx || this.drizzleDb;
    const result = await db.delete(assessments).where(eq(assessments.id, id));
    return result.rowCount > 0;
  }

  async getAll(filters?: AssessmentFilters, tx?: any): Promise<Assessment[]> {
    const db = tx || this.drizzleDb;
    let query = db.select().from(assessments);

    if (filters) {
      const conditions = [];

      if (filters.search) {
        conditions.push(like(assessments.title, `%${filters.search}%`));
      }

      if (filters.status) {
        conditions.push(eq(assessments.status, filters.status));
      }

      if (filters.userId !== undefined) {
        conditions.push(eq(assessments.userId, filters.userId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    const results = await query;

    // Parse answers for each assessment
    return results.map((assessment: any) => {
      let parsedAnswers;
      // Check if answers is already an array (no parsing needed)
      if (Array.isArray(assessment.answers)) {
        parsedAnswers = assessment.answers;
      } else if (typeof assessment.answers === 'string') {
        // Parse the JSON string
        parsedAnswers = JSON.parse(assessment.answers);
        
        // Handle malformed object structure where keys are JSON strings
        if (parsedAnswers && typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
          // Convert object with JSON string keys to array
          const answerArray = [];
          for (const key in parsedAnswers) {
            const parsedKey = JSON.parse(key);
            if (parsedKey && typeof parsedKey === 'object') {
              answerArray.push(parsedKey);
            }
          }
          parsedAnswers = answerArray;
        }
      } else {
        // If it's not a string or array, default to empty array
        parsedAnswers = [];
      }

      return {
        ...assessment,
        answers: parsedAnswers
      };
    });
  }

  /**
   * Get assessment with survey information
   */
  async getWithSurveyInfo(id: number, tx?: any): Promise<AssessmentWithSurvey | null> {
    const db = tx || this.drizzleDb;
    
    // Get the assessment
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (!assessment) return null;

    // Get the full survey with questions using the original SurveyModel
    const survey = await SurveyService.getById(assessment.surveyTemplateId);
    
    if (!survey) return null;

    // Parse answers
    let parsedAnswers;
    // Check if answers is already an array (no parsing needed)
    if (Array.isArray(assessment.answers)) {
      parsedAnswers = assessment.answers;
    } else if (typeof assessment.answers === 'string') {
      // Parse the JSON string
      parsedAnswers = JSON.parse(assessment.answers);
      
      // Handle malformed object structure where keys are JSON strings
      if (parsedAnswers && typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
        // Convert object with JSON string keys to array
        const answerArray = [];
        for (const key in parsedAnswers) {
          const parsedKey = JSON.parse(key);
          if (parsedKey && typeof parsedKey === 'object') {
            answerArray.push(parsedKey);
          }
        }
        parsedAnswers = answerArray;
      }
    } else {
      // If it's not a string or array, default to empty array
      parsedAnswers = [];
    }

    return {
      ...assessment,
      answers: parsedAnswers,
      survey: {
        id: survey.id,
        title: survey.title,
        questionsCount: survey.questionsCount,
        completionLimit: survey.completionLimit,
        questions: survey.questions, // Include the questions array
      }
    };
  }

  /**
   * Get assessments by user ID with pagination
   */
  async getByUserIdPaginated(
    userId: number,
    options: AssessmentPaginationOptions,
    tx?: any
  ): Promise<PaginatedResult<Assessment>> {
    const db = tx || this.drizzleDb;
    const { page, sortBy = "updatedAt", sortOrder = "desc" } = options;
    const pageSize = options.limit || 10;
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions = [eq(assessments.userId, userId)];

    if (options.search) {
      conditions.push(like(assessments.title, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(assessments.status, options.status));
    }

    // Build the query
    let query = db.select().from(assessments);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    if (sortBy === "updatedAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(assessments.updatedAt) : asc(assessments.updatedAt));
    } else if (sortBy === "createdAt") {
      query = query.orderBy(sortOrder === "desc" ? desc(assessments.createdAt) : asc(assessments.createdAt));
    } else if (sortBy === "title") {
      query = query.orderBy(sortOrder === "desc" ? desc(assessments.title) : asc(assessments.title));
    } else if (sortBy === "status") {
      query = query.orderBy(sortOrder === "desc" ? desc(assessments.status) : asc(assessments.status));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(assessments);

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [countResult] = await countQuery;
    const totalItems = countResult.count;

    // Get paginated results
    const assessmentsList = await query.limit(pageSize).offset(offset);

    // Parse answers for each assessment
    const parsedAssessments = assessmentsList.map((assessment: any) => {
      let parsedAnswers;
      // Check if answers is already an array (no parsing needed)
      if (Array.isArray(assessment.answers)) {
        parsedAnswers = assessment.answers;
      } else if (typeof assessment.answers === 'string') {
        // Parse the JSON string
        parsedAnswers = JSON.parse(assessment.answers);
        
        // Handle malformed object structure where keys are JSON strings
        if (parsedAnswers && typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
          // Convert object with JSON string keys to array
          const answerArray = [];
          for (const key in parsedAnswers) {
            const parsedKey = JSON.parse(key);
            if (parsedKey && typeof parsedKey === 'object') {
              answerArray.push(parsedKey);
            }
          }
          parsedAnswers = answerArray;
        }
      } else {
        // If it's not a string or array, default to empty array
        parsedAnswers = [];
      }

      return {
        ...assessment,
        answers: parsedAnswers
      };
    });

    return {
      data: parsedAssessments,
      pagination: {
        page,
        limit: pageSize,
        total: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        hasNext: page < Math.ceil(totalItems / pageSize),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Check if user has access to an assessment
   */
  async checkUserAccess(assessmentId: number, userId: number, tx?: any): Promise<boolean> {
    const db = tx || this.drizzleDb;
    
    const assessment = await this.getById(assessmentId, tx);
    if (!assessment) return false;
    
    // User owns the assessment
    if (assessment.userId === userId) return true;
    
    // Guest assessment (null userId) - no access for regular users
    if (assessment.userId === null) return false;
    
    return false;
  }
}
