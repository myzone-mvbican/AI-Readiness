import { Assessment } from "@shared/types";

export interface AssessmentsResponse {
  success: boolean;
  assessments: Assessment[];
}

// Re-export the Assessment type to match the pattern used in users
export type { Assessment };