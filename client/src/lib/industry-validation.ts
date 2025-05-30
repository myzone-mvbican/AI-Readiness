import { z } from "zod";

// NAICS industry codes validation schema
export const industrySchema = z.enum([
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
], {
  errorMap: () => ({ message: "Please select an industry" }),
});

export type IndustryCode = z.infer<typeof industrySchema>;