import { z } from "zod";

// Industry data - same as used in the IndustrySelect component
const industriesData = [
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

// Extract industry codes dynamically
const industryCodes = industriesData.map(industry => industry.code) as [string, ...string[]];

// NAICS industry codes validation schema - now dynamic
export const industrySchema = z.enum(industryCodes, {
  errorMap: () => ({ message: "Please select an industry" }),
});

export type IndustryCode = z.infer<typeof industrySchema>;

// Export industries data for use in components
export { industriesData };