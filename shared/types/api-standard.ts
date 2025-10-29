/**
 * Standardized API Response Types (Option 4 - Strict Discriminated Union)
 * 
 * This module defines the new standardized API response format.
 * Key principles:
 * - Discriminated union (success: true/false)
 * - No null fields (only include what exists)
 * - Metadata is optional and contains pagination, requestId, etc.
 * - Data is always the actual data (arrays stay arrays, not nested in 'items')
 */

/**
 * Pagination metadata structure
 */
export type PaginationMetadata = {
  page: number;          // Current page (1-indexed)
  pageSize: number;      // Items per page
  totalItems: number;    // Total count of all items
  totalPages: number;    // Total number of pages
  hasNext: boolean;      // Are there more pages after this?
  hasPrev: boolean;      // Is there a previous page?
};

/**
 * Optional metadata that can be attached to successful responses
 */
export type ResponseMetadata = {
  pagination?: PaginationMetadata;
  requestId?: string;
  timestamp?: string;
  // Future: cacheHit?, processingTime?, etc.
};

/**
 * Success Response - NO error field
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
  metadata?: ResponseMetadata;
};

/**
 * Error Response - NO data field
 */
export type ErrorResponse = {
  success: false;
  error: {
    code: string;      // e.g., "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
    message: string;   // User-friendly message
    details?: any;     // Validation errors, additional context, etc.
  };
};

/**
 * Combined API Response type (discriminated union)
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Standard Error Codes
 */
export const ErrorCodes = {
  // Authentication (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // Authorization (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  
  // Validation (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  
  // Not Found (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  
  // Conflict (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  
  // Server Errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

