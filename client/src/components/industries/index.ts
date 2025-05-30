export { IndustrySelect } from './industry-select';

// Hook to get industry name from code
export function useIndustryName(code?: string): string {
  if (!code) return 'Not specified';
  
  const industryMap: Record<string, string> = {
    "541511": "Technology / Software",
    "621111": "Healthcare", 
    "524210": "Finance / Insurance",
    "454110": "Retail / E-commerce",
    "31-33": "Manufacturing",
    "611310": "Education",
    "921190": "Government",
    "221118": "Energy / Utilities",
    "484121": "Transportation / Logistics",
    "999999": "Other",
  };

  return industryMap[code] || code;
}