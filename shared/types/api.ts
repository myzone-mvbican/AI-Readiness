/**
 * Standardized API Response Types
 * 
 * Provides consistent response structure across all API endpoints
 * while maintaining backward compatibility with existing responses.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
    requestId?: string;
  };
}

// Specific response types for common endpoints
export interface ApiListResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  details?: Record<string, any>;
}

export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Helper type for mutation responses
export interface ApiMutationResponse<T = any> extends ApiSuccessResponse<T> {
  message: string; // Required for mutations
}

/**
 * Legacy response types for backward compatibility
 * These match the current API response patterns
 */
export interface LegacyApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  assessment?: any;
  assessments?: any[];
  teams?: any[];
  surveys?: any[];
  data?: any;
}

/**
 * Response factory functions for consistent API responses
 */
export const createApiResponse = {
  success: <T>(data: T, message?: string): ApiSuccessResponse<T> => ({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  }),

  error: (error: string, details?: Record<string, any>): ApiErrorResponse => ({
    success: false,
    error,
    details,
    meta: {
      timestamp: new Date().toISOString()
    }
  }),

  list: <T>(
    data: T[], 
    pagination: { page: number; limit: number; total: number }
  ): ApiListResponse<T> => ({
    success: true,
    data,
    meta: {
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      },
      timestamp: new Date().toISOString()
    }
  }),

  mutation: <T>(
    data: T, 
    message: string
  ): ApiMutationResponse<T> => ({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  })
};