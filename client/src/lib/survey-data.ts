import { SurveyQuestion as SurveyQuestionType, SurveySection } from "@/schemas/survey-schema";

// Re-export the type
export type SurveyQuestion = SurveyQuestionType;
import Papa from "papaparse";

// Global cache for survey questions to share between components
let surveyQuestionsCache: SurveyQuestion[] = [];

export const setSurveyQuestionsCache = (questions: SurveyQuestion[]) => {
  surveyQuestionsCache = questions;
};

export const getSurveyQuestionsCache = () => {
  return surveyQuestionsCache;
};

// Get question text by ID
export const getQuestionTextById = (questionId: string): string => {
  if (!questionId) return "Unknown question";
  
  // Try to parse the question ID as a number
  const questionNumber = parseInt(questionId, 10);
  
  // If it's a number, find the question by its number
  if (!isNaN(questionNumber)) {
    const question = surveyQuestionsCache.find(q => q.number === questionNumber);
    if (question) {
      return question.question;
    }
  }
  
  // If not found by number or the ID isn't a number, return the ID as fallback
  return `Question ${questionId}`;
};

// Function to parse CSV data using PapaParse
export const parseCSV = (csvData: string): SurveyQuestion[] => {
  try {
    // Parse the CSV data using PapaParse
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors && result.errors.length > 0) {
      console.error("PapaParse errors:", result.errors);
    }

    // Map the parsed data to our SurveyQuestion type
    return result.data
      .map((row: any) => {
        const questionNumber = parseInt(row["Question Number"], 10);
        if (isNaN(questionNumber)) return null;

        return {
          number: questionNumber,
          category: row["Category"] ? row["Category"].trim() : "",
          question: row["Question Summary"]
            ? row["Question Summary"].trim()
            : "",
          details: row["Question Details"]
            ? row["Question Details"].trim()
            : "",
        };
      })
      .filter((q: SurveyQuestion | null): q is SurveyQuestion => q !== null);
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    return [];
  }
};

// Function to group questions by category
export const groupQuestionsByCategory = (
  questions: SurveyQuestion[],
): SurveySection[] => {
  const categoriesMap: Record<string, SurveyQuestion[]> = {};

  questions.forEach((question) => {
    if (!categoriesMap[question.category]) {
      categoriesMap[question.category] = [];
    }
    categoriesMap[question.category].push(question);
  });

  return Object.entries(categoriesMap).map(([category, questions]) => ({
    category,
    questions: questions.sort((a, b) => a.number - b.number),
  }));
};

// Load and parse the survey data
export const loadSurveyData = async (): Promise<SurveySection[]> => {
  try {
    // First try to load from attached_assets
    let response = await fetch("/survey-data.csv");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvData = await response.text();
    const questions = parseCSV(csvData);
    return groupQuestionsByCategory(questions);
  } catch (error) {
    console.error("Error loading survey data:", error);
    return [];
  }
};
