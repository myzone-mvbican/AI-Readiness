import { z } from "zod";
// Direct import of JSON file - now properly typed with module declaration
import industriesJson from "../assets/industries.json";

// Industry data interface
export interface Industry {
  code: string;
  name: string;
}

// Use the imported JSON data directly
export const industriesData: Industry[] = industriesJson;

// Extract industry codes dynamically from JSON data
const industryCodes = industriesData.map(industry => industry.code) as [string, ...string[]];

// Create validation schema dynamically from JSON data
export const industrySchema = z.enum(industryCodes, {
  errorMap: () => ({ message: "Please select an industry" }),
});

export type IndustryCode = z.infer<typeof industrySchema>;

// Validate industry code against the schema
export const validateIndustryCode = (code: string): code is IndustryCode => {
  return industrySchema.safeParse(code).success;
};

// Get industry display name from code
export const getIndustryDisplayName = (code: string): string => {
  const industry = industriesData.find(industry => industry.code === code);
  return industry?.name || code;
};

// Legacy mapping for backward compatibility with simple string formats
const legacyIndustryMapping: Record<string, string> = {
  "technology": "541511",
  "healthcare": "621111", 
  "finance": "524210",
  "retail": "454110",
  "manufacturing": "31-33",
  "education": "611310",
  "government": "921190",
  "energy": "221118",
  "transportation": "484121",
  "other": "999999"
};

// Reverse mapping from NAICS codes to simple strings
const naicsToSimpleMapping: Record<string, string> = {
  "541511": "technology",
  "621111": "healthcare",
  "524210": "finance", 
  "454110": "retail",
  "31-33": "manufacturing",
  "611310": "education",
  "921190": "government",
  "221118": "energy",
  "484121": "transportation",
  "999999": "other"
};

// Convert legacy industry format to NAICS code
export const convertLegacyIndustryToNAICS = (industry: string): string => {
  // If it's already a NAICS code, return as-is
  if (industriesData.find(ind => ind.code === industry)) {
    return industry;
  }
  // Convert from legacy format
  return legacyIndustryMapping[industry.toLowerCase()] || industry;
};

// Convert NAICS code to simple format for backend storage
export const convertNAICSToSimple = (naicsCode: string): string => {
  return naicsToSimpleMapping[naicsCode] || naicsCode;
};