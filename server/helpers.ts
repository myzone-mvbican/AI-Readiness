import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { CsvParseResult, CsvValidationResult } from "@shared/types";
import { getProjectRoot } from "./utils/environment";

export class CsvParser {
  static readonly REQUIRED_COLUMNS = [
    "Question Summary",
    "Category",
    "Question Details",
  ] as const;

  private static validateHeaders(headers: string[]): string[] {
    const errors: string[] = [];
    const missingColumns = this.REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col),
    );

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    return errors;
  }

  private static validateRow(row: any, rowNum: number): string[] {
    const errors: string[] = [];

    if (!row["Question Summary"]?.trim()) {
      errors.push(`Row ${rowNum}: Missing Question Summary`);
    }
    if (!row["Category"]?.trim()) {
      errors.push(`Row ${rowNum}: Missing Category`);
    }

    return errors;
  }

  static validate(csvContent: string): CsvValidationResult {
    const errors: string[] = [];
    let questionsCount = 0;

    try {
      const parsedData = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings
        transform: (value) => value?.trim(), // Trim whitespace
      });

      if (parsedData.errors.length > 0) {
        errors.push("CSV parsing failed: " + parsedData.errors[0].message);
        return { isValid: false, errors, questionsCount: 0 };
      }

      errors.push(...this.validateHeaders(parsedData.meta.fields || []));

      parsedData.data.forEach((row: any, index: number) => {
        errors.push(...this.validateRow(row, index + 1));
      });

      questionsCount = parsedData.data.filter((row: any) =>
        row["Question Summary"]?.trim(),
      ).length;

      if (questionsCount === 0) {
        errors.push("No valid questions found in the CSV");
      }
    } catch (error) {
      errors.push(`CSV validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      questionsCount,
    };
  }

  static parse(filePath: string): CsvParseResult {
    try {
      // Resolve the file path - handle both absolute and relative paths
      let resolvedPath = filePath;
      
      // Normalize path separators (convert backslashes to forward slashes)
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      // Check if the path exists as-is (could be absolute)
      if (fs.existsSync(filePath)) {
        resolvedPath = filePath;
      } else {
        // Path doesn't exist, try to resolve it
        const filename = path.basename(filePath);
        const projectRoot = getProjectRoot();
        
        // Build list of possible paths to try
        const possiblePaths: string[] = [];
        
        // 1. Try as relative path from project root (most common case: "public/uploads/file.csv")
        if (!normalizedPath.startsWith('/')) {
          possiblePaths.push(path.join(projectRoot, normalizedPath));
        }
        
        // 2. Try with leading slash removed (in case it's stored with leading slash)
        if (normalizedPath.startsWith('/')) {
          possiblePaths.push(path.join(projectRoot, normalizedPath.substring(1)));
        }
        
        // 3. Try just the filename in the uploads directory (fallback)
        possiblePaths.push(path.join(projectRoot, 'public', 'uploads', filename));
        
        // 4. If path contains 'public/uploads', ensure we handle it correctly
        if (normalizedPath.includes('public/uploads') || normalizedPath.includes('public\\uploads')) {
          const uploadsIndex = normalizedPath.indexOf('public');
          const relativePath = normalizedPath.substring(normalizedPath.indexOf('public'));
          possiblePaths.push(path.join(projectRoot, relativePath));
        }
        
        // Remove duplicates and find the first existing path
        const uniquePaths = Array.from(new Set(possiblePaths));
        resolvedPath = uniquePaths.find(p => fs.existsSync(p)) || filePath;
        
        if (!fs.existsSync(resolvedPath)) {
          // Before throwing, list all directories that DO exist for debugging
          const uploadsDir = path.join(projectRoot, 'public', 'uploads');
          const uploadsExists = fs.existsSync(uploadsDir);
          const publicDir = path.join(projectRoot, 'public');
          const publicExists = fs.existsSync(publicDir);
          
          let debugInfo = `Project root: ${projectRoot}\n`;
          debugInfo += `Process cwd: ${process.cwd()}\n`;
          debugInfo += `Public directory exists: ${publicExists} (${publicDir})\n`;
          debugInfo += `Uploads directory exists: ${uploadsExists} (${uploadsDir})\n`;
          
          if (uploadsExists) {
            try {
              const files = fs.readdirSync(uploadsDir);
              debugInfo += `Files in uploads directory (first 10): ${files.slice(0, 10).join(', ')}\n`;
            } catch (e) {
              debugInfo += `Could not read uploads directory: ${e}\n`;
            }
          }
          
          const errorMsg = `File not found: ${filePath}\n` +
            `Tried paths:\n${uniquePaths.map(p => `  - ${p}`).join('\n')}\n` +
            debugInfo;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }


      const fileContent = fs.readFileSync(resolvedPath, "utf8");

      const validation = this.validate(fileContent);

      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
          questions: [],
        };
      }

      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings
        transform: (value) => value?.trim(), // Trim whitespace
      });

      const questions = parsedData.data
        .filter((row: any) => row["Question Summary"]?.trim())
        .map((row: any, index: number) => ({
          id: row["Question Number"] || index + 1,
          question: row["Question Summary"],
          category: row["Category"],
          details: row["Question Details"],
        }));

      return {
        isValid: true,
        errors: [],
        questions,
      };
    } catch (error) {
      console.error("Error parsing CSV file:", error);
      return {
        isValid: false,
        errors: [`Error parsing CSV file: ${error}`],
        questions: [],
      };
    }
  }
}
