// Common interfaces for assessment-related data structures

// Survey question interface
export interface SurveyQuestion {
  number: number; // Question number (same as ID in most cases)
  text: string;   // Question text
  description: string; // Detailed description of the question
  detail?: string;     // Additional detail for tooltip
  category: string;    // Question category
}

// Assessment statuses
export type AssessmentStatus = 'draft' | 'in-progress' | 'completed';

// Assessment interface
export interface Assessment {
  id: number;
  title: string;
  status: AssessmentStatus;
  score: number | null;
  userId: string | null;    // Null for guest assessments
  guestEmail: string | null; // Email for guest assessments
  createdAt: Date;
  updatedAt: Date;
}

// Assessment answer interface (simplified)
export interface AssessmentAnswer {
  q: number | null; // Question ID/number
  a: -2 | -1 | 0 | 1 | 2 | null; // Answer value
}

// Guest user information
export interface GuestUser {
  id: string;
  name: string;
  email: string;
  company?: string;
}

// Survey interface
export interface Survey {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  questionCount?: number;
}

// API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}