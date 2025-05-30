/**
 * Form Validation Consolidation Demo
 * 
 * Demonstrates how the new consolidated validation system works
 * with type safety and consistent error handling.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  authSchemas, 
  surveySchemas, 
  validationUtils,
  type LoginFormValues,
  type RegisterFormValues,
  type SurveyCreateFormValues 
} from "@shared/validation/common";

/**
 * Example: Type-safe login form with consolidated validation
 */
export function useLoginForm() {
  return useForm<LoginFormValues>({
    resolver: zodResolver(authSchemas.login),
    defaultValues: {
      email: "",
      password: ""
    }
  });
}

/**
 * Example: Type-safe registration form with industry validation
 */
export function useRegistrationForm() {
  return useForm<RegisterFormValues>({
    resolver: zodResolver(authSchemas.register),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      employeeCount: "10-49",
      industry: "541511", // Technology/Software
      password: "",
      confirmPassword: ""
    }
  });
}

/**
 * Example: Survey creation form with file validation
 */
export function useSurveyForm() {
  return useForm<SurveyCreateFormValues>({
    resolver: zodResolver(surveySchemas.create),
    defaultValues: {
      title: "",
      description: "",
      selectedTeams: []
    }
  });
}

/**
 * Utility functions for form handling
 */
export const formUtils = {
  // Get industry options for dropdowns
  getIndustryOptions: validationUtils.getIndustryOptions,
  
  // Transform industry values for database compatibility
  transformIndustryForSubmission: (formData: any) => ({
    ...formData,
    industry: validationUtils.industryNameToCode(formData.industry)
  }),
  
  // Transform industry values for display
  transformIndustryForDisplay: (userData: any) => ({
    ...userData,
    industry: validationUtils.industryCodeToName(userData.industry)
  }),
  
  // Get employee count options
  getEmployeeCountOptions: () => [
    { value: "1-9", label: "1-9 employees" },
    { value: "10-49", label: "10-49 employees" },
    { value: "50-249", label: "50-249 employees" },
    { value: "250-999", label: "250-999 employees" },
    { value: "1000+", label: "1000+ employees" }
  ],
  
  // Validate file uploads
  validateCsvFile: (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: "Please select a file" };
    }
    
    if (!file.name.endsWith('.csv')) {
      return { isValid: false, error: "File must be a CSV format" };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: "File size must be less than 5MB" };
    }
    
    return { isValid: true };
  }
};