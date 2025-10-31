import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { CsvParseResult, CsvValidationResult } from "@shared/types";

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
      
      // Normalize path separators
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      // If the absolute path doesn't exist, try to resolve it relative to current working directory
      if (!fs.existsSync(filePath)) {
        // Extract just the filename part if it's a full path
        const filename = path.basename(filePath);
        
        // Try common locations
        const possiblePaths = [
          path.join(process.cwd(), normalizedPath), // Try as-is relative to cwd
          path.join(process.cwd(), 'public', 'uploads', filename), // Try in uploads folder with just filename
          // If the path contains 'public', try it relative to cwd
          normalizedPath.includes('public') 
            ? path.join(process.cwd(), normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath)
            : null,
          // Try removing leading slash if present
          normalizedPath.startsWith('/') 
            ? path.join(process.cwd(), normalizedPath.substring(1))
            : null,
        ].filter(Boolean) as string[];
        
        // Find the first path that exists
        resolvedPath = possiblePaths.find(p => fs.existsSync(p)) || filePath;
        
        if (!fs.existsSync(resolvedPath)) {
          const errorMsg = `File not found: ${filePath}. Tried paths: ${possiblePaths.join(', ')}. Current working directory: ${process.cwd()}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Log successful path resolution for debugging
      if (resolvedPath !== filePath) {
        console.log(`Resolved CSV path: ${filePath} -> ${resolvedPath}`);
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
