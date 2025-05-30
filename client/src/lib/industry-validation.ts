import { z } from "zod";

// Static NAICS codes from industries.json for validation
// These are extracted from the public/industries.json file
const INDUSTRY_CODES = [
  "541511", // Technology / Software
  "621111", // Healthcare
  "524210", // Finance / Insurance
  "454110", // Retail / E-commerce
  "31-33",  // Manufacturing
  "611310", // Education
  "921190", // Government
  "221118", // Energy / Utilities
  "484121", // Transportation / Logistics
  "999999", // Other
] as const;

export const industrySchema = z.enum(INDUSTRY_CODES, {
  errorMap: () => ({ message: "Please select your industry" }),
});

export type IndustryCode = z.infer<typeof industrySchema>;

// Helper function to validate if a string is a valid industry code
export function isValidIndustryCode(code: string): code is IndustryCode {
  return INDUSTRY_CODES.includes(code as IndustryCode);
}

// Create a more flexible schema that accepts any string but validates against known codes
export const industryCodeSchema = z.string().refine(
  (code) => isValidIndustryCode(code),
  {
    message: "Please select a valid industry",
  }
);