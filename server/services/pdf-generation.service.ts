import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AssessmentModel } from "../models/assessment.model";
import { UserModel } from "../models/user.model";
import { fileStorage } from "../utils/file-storage";
import { EmailService } from "./email.service";
import { Assessment, CsvQuestion } from "@shared/types";
import { ExactAssessmentPDF } from "../templates/exact-assessment-pdf";
import path from 'path';

// Simple PDF generation using a text-based approach
// We'll use a simpler method to avoid JSX compilation issues on the server

// Helper function for readiness level
function getReadinessLevel(score: number): string {
  if (score >= 80) return "advanced";
  if (score >= 60) return "intermediate";  
  if (score >= 40) return "developing";
  return "beginning";
}

export class PDFGenerationService {
  static async generateAndSaveAssessmentPDF(assessmentId: number, userId?: number): Promise<string | null> {
    try {
      // Get the assessment with full details
      const assessment = await AssessmentModel.getWithSurveyInfo(assessmentId);
      
      console.log(`Assessment data for ${assessmentId}:`, {
        id: assessment?.id,
        userId: assessment?.userId,
        hasGuest: !!assessment?.guest,
        guestPreview: assessment?.guest ? assessment.guest.substring(0, 100) : null
      });
      
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found`);
        return null;
      }

      // Generate PDF using React PDF on the server
      console.log(`Generating server-side PDF for assessment ${assessmentId}`);
      
      // Create the PDF buffer using React PDF (exact copy of client code)
      const pdfBuffer = await renderToBuffer(
        React.createElement(ExactAssessmentPDF, { assessment })
      );
      
      // Determine user ID for file storage
      let fileUserId = userId || assessment.userId;
      
      // For guest assessments, use a guest email or generate a guest ID
      if (!fileUserId && assessment.guest) {
        try {
          const guestData = JSON.parse(assessment.guest);
          fileUserId = `guest_${guestData.email || assessmentId}`;
          console.log(`Using guest file user ID: ${fileUserId}`);
        } catch (error) {
          console.error('Error parsing guest data:', error);
          fileUserId = `guest_${assessmentId}`;
          console.log(`Using fallback guest file user ID: ${fileUserId}`);
        }
      }
      
      // Final fallback for any assessment without user ID
      if (!fileUserId) {
        fileUserId = `assessment_${assessmentId}`;
        console.log(`Using assessment fallback file user ID: ${fileUserId}`);
      }
      
      if (!fileUserId) {
        console.error('No user ID available for PDF storage');
        return null;
      }

      // Save PDF file to public/uploads directory
      const pdfPath = await fileStorage.saveAssessmentPDF(
        fileUserId.toString(),
        assessmentId,
        pdfBuffer
      );

      // Update assessment record with PDF path
      await AssessmentModel.updatePdfPath(assessmentId, pdfPath);

      // Send email notification (disabled until React JSX issues are resolved)
      try {
        const pdfUrl = fileStorage.getPDFUrl(pdfPath);
        const fullPdfUrl = `${process.env.FRONTEND_URL || 'https://your-app.replit.app'}${pdfUrl}`;
        
        console.log(`PDF available at: ${fullPdfUrl}`);
        
        // TODO: Re-enable email notifications once React JSX compilation is fixed
        /*
        if (assessment.userId) {
          // For registered users
          const user = await UserModel.getById(assessment.userId);
          if (user?.email) {
            await EmailService.sendAssessmentCompleteEmail(
              user.email,
              assessment.survey?.title || assessment.title,
              assessment.score || 0,
              fullPdfUrl,
              false
            );
          }
        } else if (assessment.guest) {
          // For guest users
          const guestData = JSON.parse(assessment.guest);
          if (guestData.email) {
            await EmailService.sendAssessmentCompleteEmail(
              guestData.email,
              assessment.survey?.title || assessment.title,
              assessment.score || 0,
              fullPdfUrl,
              true
            );
          }
        }
        */
      } catch (emailError) {
        console.error('Error in email notification logic:', emailError);
        // Don't fail PDF generation if email fails
      }

      console.log(`PDF generated and saved for assessment ${assessmentId}: ${pdfPath}`);
      
      // Verify the PDF file was created
      try {
        const fs = await import('fs');
        const pdfStats = await fs.promises.stat(pdfPath);
        console.log(`PDF file size: ${pdfStats.size} bytes`);
      } catch (error) {
        console.error(`Failed to verify PDF file: ${error.message}`);
      }
      return pdfPath;

    } catch (error) {
      console.error(`Error generating PDF for assessment ${assessmentId}:`, error);
      return null;
    }
  }

  static async getAssessmentPDFUrl(assessmentId: number): Promise<string | null> {
    try {
      const assessment = await AssessmentModel.getById(assessmentId);
      
      if (!assessment?.pdfPath) {
        return null;
      }

      return fileStorage.getPDFUrl(assessment.pdfPath);
    } catch (error) {
      console.error(`Error getting PDF URL for assessment ${assessmentId}:`, error);
      return null;
    }
  }
}