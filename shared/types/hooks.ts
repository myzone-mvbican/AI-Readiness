/**
 * React Hook Types
 * 
 * This file defines type-safe interfaces for React hooks used throughout the application.
 * These types provide better IntelliSense support and runtime type safety.
 */

import { User } from './models';
import { LoginInput, InsertUser } from './requests';

/**
 * Authentication Hook Types
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: InsertUser) => Promise<void>;
  clearError: () => void;
}

export type UseAuthReturn = AuthState & AuthActions;

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'VALIDATION_ERROR';
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Assessment Hook Types
 */
export interface AssessmentState {
  currentQuestion: number;
  totalQuestions: number;
  answers: Record<number, any>;
  isSubmitting: boolean;
  error: string | null;
}

export interface AssessmentActions {
  setAnswer: (questionId: number, answer: any) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitAssessment: () => Promise<void>;
  resetAssessment: () => void;
}

export type UseAssessmentReturn = AssessmentState & AssessmentActions;

/**
 * Form Hook Types
 */
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface FormActions<T = any> {
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  reset: (data?: Partial<T>) => void;
  submit: () => Promise<void>;
}

export type UseFormReturn<T = any> = FormState<T> & FormActions<T>;

/**
 * Data Fetching Hook Types
 */
export interface DataState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface DataActions<T = any> {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
  invalidate: () => void;
}

export type UseDataReturn<T = any> = DataState<T> & DataActions<T>;

/**
 * Pagination Hook Types
 */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
}

export type UsePaginationReturn = PaginationState & PaginationActions;

/**
 * Local Storage Hook Types
 */
export interface StorageState<T = any> {
  value: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface StorageActions<T = any> {
  setValue: (value: T) => void;
  removeValue: () => void;
  refresh: () => void;
}

export type UseStorageReturn<T = any> = StorageState<T> & StorageActions<T>;