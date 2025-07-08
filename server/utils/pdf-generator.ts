import fs from 'fs';
import path from 'path';
import { Assessment } from '@shared/types';
import { AssessmentPDFServer, renderToBuffer } from '../components/assessment-pdf-server';
import React from 'react';

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
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
    const today = new Date();
    const completed = new Date(assessment.completedOn || today);
    return `myzoneai-readiness-report-${completed.toISOString().split('T')[0]}.pdf`;
  }

  private static getUploadPath(userId?: string | number, guestEmail?: string): string {
    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads');
    
    if (userId) {
      // Convert userId to string if it's a number
      const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
      return path.join(baseUploadPath, userIdStr);
    } else if (guestEmail) {
      return path.join(baseUploadPath, 'guest', guestEmail);
    } else {
      return path.join(baseUploadPath, 'guest', 'anonymous');
    }
  }

  static async generateAndSavePDF(
    assessment: Assessment,
    userId?: string | number,
    guestEmail?: string
  ): Promise<PDFGenerationResult> {
    try {
      // Generate file name
      const fileName = this.generateFileName(assessment);
      
      // Get upload path
      const uploadDir = this.getUploadPath(userId, guestEmail);
      this.ensureDirectoryExists(uploadDir);
      
      const filePath = path.join(uploadDir, fileName);
      
      // Generate PDF using React PDF
      const pdfBuffer = await renderToBuffer(
        React.createElement(AssessmentPDFServer, { assessment })
      );
      
      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer);
      
      console.log(`PDF generated successfully for assessment ${assessment.id}`);
      console.log(`File saved to: ${filePath}`);
      console.log(`User ID: ${userId || 'guest'} (type: ${typeof userId})`);
      console.log(`Guest email: ${guestEmail || 'none'}`);
      
      return {
        success: true,
        filePath,
        fileName,
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}