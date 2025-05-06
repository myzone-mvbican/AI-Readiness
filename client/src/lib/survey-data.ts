import { SurveyQuestion, SurveySection } from "@/schemas/survey-schema";
import readinessAssessmentCSV from "@assets/Readiness Assessment Data April 26th 2025.csv";

// Function to parse CSV data
export const parseCSV = (csvData: string): SurveyQuestion[] => {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map((line) => {
    // Handle commas within quotes properly
    const parts = [];
    let part = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(part);
        part = "";
      } else {
        part += char;
      }
    }
    
    parts.push(part); // Add the last part
    
    return {
      number: parseInt(parts[0], 10),
      category: parts[1].replace(/"/g, ''),
      question: parts[2].replace(/"/g, ''),
      details: parts[3].replace(/"/g, '')
    };
  }).filter(q => !isNaN(q.number)); // Filter out any invalid entries
};

// Function to group questions by category
export const groupQuestionsByCategory = (questions: SurveyQuestion[]): SurveySection[] => {
  const categoriesMap: Record<string, SurveyQuestion[]> = {};
  
  questions.forEach((question) => {
    if (!categoriesMap[question.category]) {
      categoriesMap[question.category] = [];
    }
    categoriesMap[question.category].push(question);
  });
  
  return Object.entries(categoriesMap).map(([category, questions]) => ({
    category,
    questions: questions.sort((a, b) => a.number - b.number)
  }));
};

// Load and parse the survey data
export const loadSurveyData = async (): Promise<SurveySection[]> => {
  try {
    // For simplicity, this fetches the CSV file directly
    const response = await fetch(readinessAssessmentCSV);
    const csvData = await response.text();
    const questions = parseCSV(csvData);
    return groupQuestionsByCategory(questions);
  } catch (error) {
    console.error("Error loading survey data:", error);
    return [];
  }
};