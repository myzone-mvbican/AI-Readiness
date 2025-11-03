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

  /**
   * Parse CSV from file buffer or string content
   */
  static parseFromContent(fileContent: string | Buffer): CsvParseResult {
    try {
      // Convert buffer to string if needed
      const content = Buffer.isBuffer(fileContent)
        ? fileContent.toString('utf-8')
        : fileContent;

      const validation = this.validate(content);

      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
          questions: [],
        };
      }

      const parsedData = Papa.parse(content, {
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
      console.error("Error parsing CSV content:", error);
      return {
        isValid: false,
        errors: [`Error parsing CSV content: ${error}`],
        questions: [],
      };
    }
  }
}
