import { z } from "zod";

// Industry data interface
export interface Industry {
  code: string;
  name: string;
}

// Function to load and create validation schema from JSON file
export const createIndustryValidation = async () => {
  try {
    const response = await fetch('/industries.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const industriesData: Industry[] = await response.json();
    
    // Extract codes from loaded data
    const industryCodes = industriesData.map(industry => industry.code) as [string, ...string[]];
    
    // Create schema from loaded data
    const industrySchema = z.enum(industryCodes, {
      errorMap: () => ({ message: "Please select an industry" }),
    });
    
    return {
      industriesData,
      industrySchema,
      industryCodes
    };
  } catch (error) {
    console.error('Failed to load industries data:', error);
    throw error;
  }
};

// Simple validation function for runtime checks
export const validateIndustryCode = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch('/industries.json');
    const industriesData: Industry[] = await response.json();
    return industriesData.some(industry => industry.code === code);
  } catch (error) {
    console.error('Failed to validate industry code:', error);
    return false;
  }
};

// For now, export a basic schema that will be replaced by form validation hooks
export const industrySchema = z.string().min(1, "Please select an industry");
export type IndustryCode = string;