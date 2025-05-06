import { SurveyQuestion, SurveySection } from "@/schemas/survey-schema";

// Simple CSV parsing function for browser
export const parseCSV = (csvData: string): SurveyQuestion[] => {
  try {
    // Skip the header row
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    // Extract questions from CSV rows (skip header row)
    const questions: SurveyQuestion[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Handle commas within quoted fields
      let currentLine = lines[i];
      let inQuotes = false;
      let currentField = '';
      let fields: string[] = [];
      
      for (let j = 0; j < currentLine.length; j++) {
        const char = currentLine[j];
        
        if (char === '"' && (j === 0 || currentLine[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // Add the last field
      fields.push(currentField);
      
      // Create question object
      if (fields.length >= 4) {
        const questionNumber = parseInt(fields[0], 10);
        if (!isNaN(questionNumber)) {
          questions.push({
            number: questionNumber,
            category: fields[1] ? fields[1].trim() : '',
            question: fields[2] ? fields[2].trim() : '',
            details: fields[3] ? fields[3].trim().replace(/^"|"$/g, '') : ''
          });
        }
      }
    }
    
    return questions;
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    return [];
  }
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
    // First try to load from attached_assets
    let response = await fetch('/attached_assets/Readiness Assessment Data April 26th 2025.csv');
    
    // If that fails, try fallback locations
    if (!response.ok) {
      console.log('Trying alternative location for CSV file...');
      response = await fetch('/Readiness Assessment Data April 26th 2025.csv');
    }
    
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