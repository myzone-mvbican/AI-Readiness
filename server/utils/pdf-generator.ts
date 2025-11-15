import fs from "fs";
import React from "react";
import path from "path";
import { Assessment } from "@shared/types";
import { renderToBuffer } from "@react-pdf/renderer";
import { AssessmentPDF } from "../../client/src/pdfs/assessment";
import { getProjectRoot } from "./environment";

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  relativePath?: string;
  fileName?: string;
  buffer?: Buffer;
  error?: string;
}

export class PDFGenerator {
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private static generateFileName(assessment: Assessment, companyName?: string): string {
    // Use assessment completion date if available, otherwise use today
    // This ensures regenerated PDFs keep the same filename
    const dateToUse = assessment.completedOn ? new Date(assessment.completedOn) : new Date();
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Format company name: lowercase, replace spaces with dashes, remove special chars
    const formattedCompany = companyName
      ? companyName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      : 'assessment';
    
    return `${formattedCompany}-${dateStr}.pdf`;
  }

  private static getUploadPath(
    userId?: string | number,
    guestEmail?: string,
  ): string {
    const baseUploadPath = path.join(getProjectRoot(), "public", "uploads");

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
    companyName?: string,
  ): Promise<PDFGenerationResult> {
    try {
      // Debug logging
      console.log("PDF Generator - Received assessment with survey?", !!(assessment as any).survey);
      console.log("PDF Generator - Survey questions count:", ((assessment as any).survey?.questions?.length || 0));
      console.log("PDF Generator - First question:", ((assessment as any).survey?.questions?.[0]));
      
      // Generate file name
      const fileName = this.generateFileName(assessment, companyName);

      // Get upload path
      const uploadDir = this.getUploadPath(userId, guestEmail);
      this.ensureDirectoryExists(uploadDir);

      const filePath = path.join(uploadDir, fileName);

      const logoPath = path.join(
        process.cwd(),
        "client/src/assets/logo-keeran.png",
      );

      // Generate PDF using React PDF
      const pdfBuffer = await renderToBuffer(
        React.createElement(AssessmentPDF, { assessment, logoUrl: logoPath }),
      );

      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      // Generate relative path for database storage
      const relativePath = this.getRelativePath(fileName, userId, guestEmail);


      return {
        success: true,
        filePath,
        relativePath,
        fileName,
        buffer: pdfBuffer,
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
