/**
 * Integration with existing industry validation system
 * 
 * This demonstrates how to use the existing lib/industry-validation.ts
 * with the new API response standardization.
 */

import { industriesData, getIndustryDisplayName, industrySchema } from "./industry-validation";
import { apiRequest } from "./queryClient";

/**
 * Form utilities that properly use your existing industry validation
 */
export const formUtils = {
  // Get industry options for dropdowns using your existing data
  getIndustryOptions: () => industriesData.map(industry => ({
    value: industry.code,
    label: industry.name
  })),

  // Get employee count options
  getEmployeeCountOptions: () => [
    { value: "1-9", label: "1-9 employees" },
    { value: "10-49", label: "10-49 employees" },
    { value: "50-249", label: "50-249 employees" },
    { value: "250-999", label: "250-999 employees" },
    { value: "1000+", label: "1000+ employees" }
  ],

  // Validate industry code using your existing schema
  validateIndustryCode: (code: string) => industrySchema.safeParse(code).success,

  // Get display name using your existing function
  getIndustryDisplayName: (code: string) => getIndustryDisplayName(code),

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

/**
 * API helpers that use standardized responses with your existing validation
 */
export const apiHelpers = {
  // Example of using standardized API with industry validation
  async validateFormData(formData: any) {
    try {
      // Validate industry using your existing schema
      if (formData.industry && !formUtils.validateIndustryCode(formData.industry)) {
        throw new Error('Invalid industry code');
      }

      const response = await apiRequest("POST", "/api/demo/validation", {
        ...formData,
        industryDisplayName: formUtils.getIndustryDisplayName(formData.industry)
      });

      return await response.json();
    } catch (error) {
      console.error('Form validation failed:', error);
      throw error;
    }
  }
};