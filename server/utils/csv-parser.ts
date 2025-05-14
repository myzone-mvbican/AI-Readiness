import fs from 'fs';
import path from 'path';
import { parse } from 'papaparse';
import { SurveyQuestion } from '../../shared/types';

// Custom error types for CSV parsing
export class CsvParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParsingError';
  }
}

export class CsvFileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvFileNotFoundError';
  }
}

interface CsvCache {
  [key: string]: {
    timestamp: number;
    data: SurveyQuestion[];
  }
}

// Cache for parsed CSV files to avoid redundant parsing
const csvCache: CsvCache = {};

// Utility to find CSV file in multiple possible locations
export async function findCsvFile(filename: string): Promise<string> {
  const possibleLocations = [
    path.join(process.cwd(), 'public', 'uploads', filename),
    path.join(process.cwd(), 'uploads', filename),
    path.join('/uploads', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), 'uploads', 'surveys', filename),
  ];

  console.log('Looking for CSV file in these locations:', possibleLocations);

  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log('File found at:', location);
      return location;
    }
  }

  throw new CsvFileNotFoundError(`CSV file not found: ${filename}`);
}

// Parse CSV file and map to SurveyQuestion interface
export async function parseCsvQuestions(filename: string): Promise<SurveyQuestion[]> {
  try {
    // Check if we have a cached version
    if (csvCache[filename]) {
      const filePath = await findCsvFile(filename);
      const stats = fs.statSync(filePath);
      const fileTimestamp = stats.mtimeMs;
      
      // If the cache is still valid (file hasn't been modified)
      if (csvCache[filename].timestamp === fileTimestamp) {
        console.log(`Using cached CSV data for ${filename}`);
        return csvCache[filename].data;
      }
    }

    // Find and read the file
    const filePath = await findCsvFile(filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    // Parse CSV
    const { data, errors } = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Handle parsing errors
    if (errors.length > 0) {
      console.error('CSV parsing errors:', errors);
      throw new CsvParsingError(`Error parsing CSV: ${errors[0].message}`);
    }

    // Map and validate CSV data to SurveyQuestion interface
    const questions: SurveyQuestion[] = data.map((row: any, index: number) => {
      // Validate required fields
      if (!row.question && !row.text) {
        throw new CsvParsingError(`Missing question text at row ${index + 1}`);
      }

      return {
        number: row.id || row.number || index + 1, // Use index+1 if no number/id provided
        text: row.question || row.text,
        description: row.description || row.detail || '',
        detail: row.detail || row.description || '',
        category: row.category || 'General',
      };
    });

    // Cache the parsed data with timestamp
    csvCache[filename] = {
      timestamp: stats.mtimeMs,
      data: questions,
    };

    console.log(`Successfully parsed ${questions.length} questions from ${filename}`);
    return questions;
  } catch (error) {
    if (error instanceof CsvFileNotFoundError || error instanceof CsvParsingError) {
      throw error;
    }
    throw new Error(`Failed to process CSV file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Utility to get CSV file info (size, modification date, etc.)
export async function getCsvFileInfo(filename: string): Promise<{
  size: number;
  lastModified: Date;
  path: string;
}> {
  try {
    const filePath = await findCsvFile(filename);
    const stats = fs.statSync(filePath);
    
    return {
      size: stats.size,
      lastModified: stats.mtime,
      path: filePath,
    };
  } catch (error) {
    throw new CsvFileNotFoundError(`Could not get file info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Clear cache for specific file or all files
export function clearCsvCache(filename?: string): void {
  if (filename) {
    delete csvCache[filename];
    console.log(`Cache cleared for ${filename}`);
  } else {
    Object.keys(csvCache).forEach(key => delete csvCache[key]);
    console.log('All CSV cache cleared');
  }
}