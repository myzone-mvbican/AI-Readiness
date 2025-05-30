/**
 * Centralized Type System
 * 
 * This file serves as the main entry point for all shared types in the application.
 * It re-exports types from specialized modules to provide a clean, organized API.
 * 
 * Organization:
 * - models.ts: Core data models that map to database entities
 * - requests.ts: Types for API request payloads
 * - responses.ts: Types for API response structures
 * 
 * Usage:
 * import { User, Team, SurveyWithAuthor } from '@shared/types';
 */

// Re-export all types from the specialized modules
export * from './models';
export * from './requests';
export * from './responses';
export * from './hooks';
export * from './performance';
// Explicitly re-export API types to avoid naming conflicts
export type {
  ApiResponse as StandardApiResponse,
  ApiListResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiMutationResponse,
  LegacyApiResponse,
  createApiResponse
} from './api';