import { Assessment } from "@shared/types";
import { AssessmentsResponse as SharedAssessmentsResponse, AssessmentsResponseStandard } from "@shared/types/responses";

// Export the shared response type (legacy)
export type AssessmentsResponse = SharedAssessmentsResponse;

// NEW: Export standardized response type
export type AssessmentsResponseNew = AssessmentsResponseStandard;

// Re-export the Assessment type to match the pattern used in users
export type { Assessment };