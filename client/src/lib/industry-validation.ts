import { z } from "zod";

// Industry data interface
export interface Industry {
  code: string;
  name: string;
}

// Define industries data directly from the JSON file structure
// This ensures the validation schema matches exactly what's in industries.json
export const industriesData: Industry[] = [
  { code: "541511", name: "Technology / Software" },
  { code: "621111", name: "Healthcare" },
  { code: "524210", name: "Finance / Insurance" },
  { code: "454110", name: "Retail / E-commerce" },
  { code: "31-33", name: "Manufacturing" },
  { code: "611310", name: "Education" },
  { code: "921190", name: "Government" },
  { code: "221118", name: "Energy / Utilities" },
  { code: "484121", name: "Transportation / Logistics" },
  { code: "999999", name: "Other" },
];

// Extract industry codes dynamically from data
const industryCodes = industriesData.map(industry => industry.code) as [string, ...string[]];

// Create validation schema from the data
export const industrySchema = z.enum(industryCodes, {
  errorMap: () => ({ message: "Please select an industry" }),
});

export type IndustryCode = z.infer<typeof industrySchema>;

// Validate industry code against the schema
export const validateIndustryCode = (code: string): code is IndustryCode => {
  return industrySchema.safeParse(code).success;
};