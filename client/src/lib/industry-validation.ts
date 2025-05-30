import { z } from "zod";
// Static import of JSON data - works with Vite's build system
import industriesJson from "../assets/industries.json" assert { type: "json" };

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