import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { SurveyQuestion } from '../../shared/types';
import { ApiError } from '../middlewares/error-handler';

// Cache structure
interface CsvCache {
  [key: string]: {
    timestamp: number;
    data: SurveyQuestion[];
  };
}

// How long to keep cached CSV data (in milliseconds)
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Global cache object
const csvCache: CsvCache = {};

/**
 * Find a CSV file by trying different locations
 * @param filename The name of the CSV file to find
 * @returns The full path to the file if found, otherwise null
 */
function findCsvFile(filename: string): string | null {
  // Possible locations to check
  const possibleLocations = [
    path.join(process.cwd(), 'public', 'uploads', filename),
    path.join(process.cwd(), 'uploads', filename),
    path.join('/uploads', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), 'uploads', 'surveys', filename)
  ];
  
  console.log(`Looking for CSV file in these locations: ${JSON.stringify(possibleLocations, null, 2)}`);
  
  // Try each location
  for (const location of possibleLocations) {
    try {
      if (fs.existsSync(location)) {
        console.log(`File found at: ${location}`);
        return location;
      }
    } catch (error) {
      // Ignore errors and try the next location
    }
  }
  
  console.error(`CSV file "${filename}" not found in any of the expected locations`);
  return null;
}

/**
 * Check if cached data is still valid
 * @param cacheKey The cache key to check
 * @returns True if the cache is valid, false otherwise
 */
function isCacheValid(cacheKey: string): boolean {
  if (!csvCache[cacheKey]) return false;
  
  const now = Date.now();
  const cacheTimestamp = csvCache[cacheKey].timestamp;
  return (now - cacheTimestamp) < CACHE_TTL;
}

/**
 * Parse a CSV file and return survey questions
 * @param filename The CSV file to parse
 * @returns Array of survey questions
 */
export async function parseCsvQuestions(filename: string): Promise<SurveyQuestion[]> {
  try {
    // Return cached data if available and valid
    if (isCacheValid(filename)) {
      console.log(`Using cached CSV data for ${filename}`);
      return csvCache[filename].data;
    }
    
    // Find the file
    const filePath = findCsvFile(filename);
    if (!filePath) {
      throw ApiError.notFound(`CSV file "${filename}" not found`);
    }
    
    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      throw ApiError.serverError('Error parsing CSV file', parseResult.errors);
    }
    
    // Transform data into SurveyQuestion format
    const questions: SurveyQuestion[] = parseResult.data.map((row: any, index: number) => {
      // Try different field names since CSV files might have inconsistent headers
      const number = getValueFromMultipleKeys(row, ['number', 'id', 'question_number', 'questionNumber']);
      const text = getValueFromMultipleKeys(row, ['text', 'question', 'questionText', 'question_text']);
      const description = getValueFromMultipleKeys(row, ['description', 'desc', 'questionDescription', 'question_description']);
      const detail = getValueFromMultipleKeys(row, ['detail', 'details', 'additional_info', 'additionalInfo']);
      const category = getValueFromMultipleKeys(row, ['category', 'cat', 'group', 'section']) || 'General';
      
      // Validate required fields
      if (!number) {
        throw ApiError.badRequest(`Missing question number in row ${index + 1}`);
      }
      
      if (!text) {
        throw ApiError.badRequest(`Missing question text in row ${index + 1}`);
      }
      
      return {
        number: parseInt(number as string, 10),
        text: text as string,
        description: description as string || null,
        detail: detail as string || null,
        category: category as string
      };
    });
    
    // Sort by question number
    questions.sort((a, b) => a.number - b.number);
    
    // Cache the result
    csvCache[filename] = {
      timestamp: Date.now(),
      data: questions
    };
    
    return questions;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error parsing CSV file:', error);
    throw ApiError.serverError('Failed to parse CSV file', error);
  }
}

/**
 * Helper to get a value from multiple possible keys in an object
 * @param obj The object to check
 * @param keys Array of possible keys to try
 * @returns The first non-empty value found, or null if none
 */
function getValueFromMultipleKeys(obj: any, keys: string[]): string | null {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return null;
}

/**
 * Clear the CSV cache
 * @param filename Optional specific file to clear from cache
 */
export function clearCsvCache(filename?: string): void {
  if (filename) {
    delete csvCache[filename];
  } else {
    Object.keys(csvCache).forEach(key => delete csvCache[key]);
  }
}