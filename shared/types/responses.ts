import { 
  User, 
  Team, 
  TeamWithRole, 
  Survey, 
  SurveyWithAuthor, 
  Assessment 
} from './models';

// Base response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Authentication responses
export interface AuthResponse extends ApiResponse {
  user?: User;
  token?: string;
}

// User responses
export interface UserResponse extends ApiResponse {
  user?: User;
}

export interface UsersResponse extends ApiResponse {
  users?: User[];
}

// Team responses
export interface TeamResponse extends ApiResponse {
  team?: Team;
}

export interface TeamsResponse extends ApiResponse {
  teams?: Team[];
  userTeams?: TeamWithRole[];
}

// Survey responses
export interface SurveyResponse extends ApiResponse {
  survey?: Survey | SurveyWithAuthor;
}

export interface SurveysResponse extends ApiResponse {
  surveys?: Survey[] | SurveyWithAuthor[];
}

// Assessment responses
export interface AssessmentResponse extends ApiResponse {
  assessment?: Assessment;
}

export interface AssessmentsResponse extends ApiResponse {
  assessments?: Assessment[];
}

// Error responses
export interface ErrorResponse extends ApiResponse {
  error?: string;
}