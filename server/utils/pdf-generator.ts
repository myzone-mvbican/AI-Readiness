import fs from "fs";
import React from "react";
import path from "path";
import { Assessment } from "@shared/types";
import { renderToBuffer } from "@react-pdf/renderer";
import { AssessmentPDF } from "../../client/src/pdfs/assessment";

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  relativePath?: string;
  fileName?: string;
  error?: string;
}

export class PDFGenerator {
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private static generateFileName(assessment: Assessment): string {
    // const today = new Date();
    // const completed = new Date(assessment.completedOn || today);
    return `report-${assessment.id}.pdf`;
  }

  private static getUploadPath(
    userId?: string | number,
    guestEmail?: string,
  ): string {
    const baseUploadPath = path.join(process.cwd(), "public", "uploads");

    if (userId) {
      // Convert userId to string if it's a number
      const userIdStr = typeof userId === "number" ? userId.toString() : userId;
      return path.join(baseUploadPath, userIdStr);
    } else if (guestEmail) {
      return path.join(baseUploadPath, "guest", guestEmail);
    } else {
      return path.join(baseUploadPath, "guest", "anonymous");
    }
  }

  private static getRelativePath(
    fileName: string,
    userId?: string | number,
    guestEmail?: string,
  ): string {
    if (userId) {
      const userIdStr = typeof userId === "number" ? userId.toString() : userId;
      return `/uploads/${userIdStr}/${fileName}`;
    } else if (guestEmail) {
      return `/uploads/guest/${guestEmail}/${fileName}`;
    } else {
      return `/uploads/guest/anonymous/${fileName}`;
    }
  }

  static async generateAndSavePDF(
    assessment: Assessment,
    userId?: string | number,
    guestEmail?: string,
  ): Promise<PDFGenerationResult> {
    try {
      // Generate file name
      const fileName = this.generateFileName(assessment);

      // Get upload path
      const uploadDir = this.getUploadPath(userId, guestEmail);
      this.ensureDirectoryExists(uploadDir);

      const filePath = path.join(uploadDir, fileName);

      const logoPath = path.join(
        process.cwd(),
        "client/src/assets/logo-myzone-ai.png",
      );

      // Generate PDF using React PDF
      const pdfBuffer = await renderToBuffer(
        React.createElement(AssessmentPDF, { assessment, logoUrl: logoPath }),
      );

      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      // Generate relative path for database storage
      const relativePath = this.getRelativePath(fileName, userId, guestEmail);

      console.log(`PDF generated successfully for assessment ${assessment.id}`);
      console.log(`File saved to: ${filePath}`);
      console.log(`Relative path: ${relativePath}`);
      console.log(`User ID: ${userId || "guest"} (type: ${typeof userId})`);
      console.log(`Guest email: ${guestEmail || "none"}`);

      return {
        success: true,
        filePath,
        relativePath,
        fileName,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
