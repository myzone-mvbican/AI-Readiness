import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ApiError } from '../middlewares/error-handler';

// Type definition for CSV cache entry
interface CsvCacheEntry<T> {
  data: T[];
  timestamp: number;
}

// Cache to store parsed CSV data with timestamps
const csvCache: Record<string, CsvCacheEntry<any>> = {};

// Cache invalidation time in ms (default: 10 minutes)
const CACHE_INVALIDATION_TIME = 10 * 60 * 1000;

/**
 * Parses a CSV file and returns the data as an array of objects
 * Includes caching with timestamp-based invalidation
 * 
 * @param filePath Path to the CSV file
 * @param options Parsing options
 * @returns Array of parsed objects from the CSV
 */
export function parseCsvFile<T>(
  filePath: string,
  options: {
    headers?: string[] | boolean;
    skipFirstRow?: boolean;
    cache?: boolean;
    transform?: (row: Record<string, any>) => T;
  } = {}
): T[] {
  const absolutePath = path.resolve(process.cwd(), filePath);
  
  // Default options
  const {
    headers = true,
    skipFirstRow = false,
    cache = true,
    transform = (row) => row as unknown as T
  } = options;
  
  // Check if cached data exists and is still valid
  const cacheKey = `${absolutePath}:${JSON.stringify(options)}`;
  const now = Date.now();
  
  if (cache && csvCache[cacheKey] && (now - csvCache[cacheKey].timestamp) < CACHE_INVALIDATION_TIME) {
    return csvCache[cacheKey].data;
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new ApiError(404, `CSV file not found: ${filePath}`);
    }
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    
    const parseOptions: any = {
      columns: headers,
      skip_empty_lines: true,
      trim: true
    };
    
    if (skipFirstRow) {
      parseOptions.from_line = 2;
    }
    
    const records = parse(fileContent, parseOptions);
    
    // Transform records if needed
    const transformedRecords = records.map(transform);
    
    // Cache the result if caching is enabled
    if (cache) {
      csvCache[cacheKey] = {
        data: transformedRecords,
        timestamp: now
      };
    }
    
    return transformedRecords;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('CSV parsing error:', error);
    throw new ApiError(500, `Failed to parse CSV file: ${error.message}`);
  }
}

/**
 * Invalidate cache for a specific file or all files
 * 
 * @param filePath Optional file path to invalidate specific cache entry
 */
export function invalidateCsvCache(filePath?: string): void {
  if (filePath) {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Find and remove all cache entries for this file
    Object.keys(csvCache).forEach(key => {
      if (key.startsWith(`${absolutePath}:`)) {
        delete csvCache[key];
      }
    });
  } else {
    // Clear entire cache
    Object.keys(csvCache).forEach(key => {
      delete csvCache[key];
    });
  }
}