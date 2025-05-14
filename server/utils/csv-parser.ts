import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

interface CsvParseOptions<T> {
  headers?: string[];
  skipFirstRow?: boolean;
  transform?: (row: Record<string, string>) => T;
}

// Cache for parsed CSV data to avoid repeated file reads
const csvCache: Record<string, {
  data: any[];
  timestamp: number;
}> = {};

/**
 * Parse a CSV file and return an array of objects
 * @param filePath Path to the CSV file
 * @param options Parsing options
 * @returns Array of parsed objects
 */
export function parseCsvFile<T>(
  filePath: string,
  options: CsvParseOptions<T> = {}
): T[] {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Get the file's last modification time
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtimeMs;
    
    // Check if we have a valid cached version
    if (
      csvCache[filePath] && 
      csvCache[filePath].timestamp === lastModified
    ) {
      return csvCache[filePath].data;
    }
    
    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Prepare parsing options
    const parseOptions: any = {
      columns: options.headers || true,
      skip_empty_lines: true
    };
    
    // Parse CSV content
    let records = parse(fileContent, parseOptions);
    
    // Skip first row if needed (usually headers)
    if (options.skipFirstRow && records.length > 0) {
      records = records.slice(1);
    }
    
    // Transform rows if needed
    if (options.transform) {
      records = records.map(options.transform);
    }
    
    // Cache the parsed data
    csvCache[filePath] = {
      data: records,
      timestamp: lastModified
    };
    
    return records;
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw new Error(`Failed to parse CSV file: ${path.basename(filePath)}`);
  }
}

/**
 * Clear the CSV cache for a specific file or all files if no path is provided
 * @param filePath Optional path to clear specific cache entry
 */
export function clearCsvCache(filePath?: string): void {
  if (filePath && csvCache[filePath]) {
    delete csvCache[filePath];
  } else if (!filePath) {
    Object.keys(csvCache).forEach(key => {
      delete csvCache[key];
    });
  }
}