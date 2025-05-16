import Papa from "papaparse";
import fs from "fs";

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  questionsCount: number;
}

export class CsvParser {
  static readonly REQUIRED_COLUMNS = [
    "Question Summary",
    "Category",
    "Question Details",
  ];

  static validate(csvContent: string): CsvValidationResult {
    const errors: string[] = [];
    let questionsCount = 0;

    try {
      const parsedData = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      // Check for parsing errors
      if (parsedData.errors.length > 0) {
        errors.push("CSV parsing failed: " + parsedData.errors[0].message);
        return { isValid: false, errors, questionsCount: 0 };
      }

      // Validate headers
      const headers = parsedData.meta.fields || [];
      const missingColumns = this.REQUIRED_COLUMNS.filter(
        (col) => !headers.includes(col),
      );

      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
      }

      // Validate rows
      parsedData.data.forEach((row: any, index: number) => {
        const rowNum = index + 1;

        if (!row["Question Summary"]?.trim()) {
          errors.push(`Row ${rowNum}: Missing Question Summary`);
        }
        if (!row["Category"]?.trim()) {
          errors.push(`Row ${rowNum}: Missing Category`);
        }
      });

      // Count valid questions
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

  static parse(filePath: string) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      // Map CSV data to questions with the correct column names
      const questions = parsedData.data
        .filter((row: any) => row["Question Summary"]?.trim())
        .map((row: any, index: number) => ({
          id: index + 1,
          question: row["Question Summary"] || "",
          category: row["Category"] || "",
          details: row["Question Details"] || "",
        }));

      return questions;
    } catch (error) {
      console.error("Error parsing CSV file:", error);
      throw error;
    }
  }
}
