import { Assessment } from "@shared/types";
import { AssessmentsResponse as SharedAssessmentsResponse } from "@shared/types/responses";

// Export the shared response type
export type AssessmentsResponse = SharedAssessmentsResponse;

// Re-export the Assessment type to match the pattern used in users
export type { Assessment };