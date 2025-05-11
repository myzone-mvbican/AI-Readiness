import { Assessment } from "@shared/schema";

export interface AssessmentsResponse {
  success: boolean;
  assessments: Assessment[];
}

// Re-export the Assessment type to match the pattern used in users
export type { Assessment };