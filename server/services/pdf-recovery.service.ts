import fs from "fs";
import path from "path";
import { AssessmentRepository } from "../repositories/assessment.repository";
import { PDFGenerator } from "../utils/pdf-generator";
import { getProjectRoot } from "../utils/environment";
import { NotFoundError, InternalServerError } from "../utils/errors";
import { UserService } from "./user.service";

export interface RecoveryResult {
  success: boolean;
  filePath?: string;
  relativePath?: string;
  error?: string;
  reason?: string;
}

export class PdfRecoveryService {
  private static assessmentRepository = new AssessmentRepository();
  private static recoveryInProgress = new Map<number, Promise<RecoveryResult>>();

  /**
   * Check if a PDF file physically exists on the filesystem
   */
  private static doesFileExist(relativePath: string): boolean {
    try {
      // Remove leading slash to prevent path.join from treating it as absolute
      const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
      const fullPath = path.join(getProjectRoot(), "public", cleanPath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract assessment ID from PDF filename
   * Expected format: report-{id}.pdf
   */
  static extractAssessmentIdFromPath(requestPath: string): number | null {
    try {
      const filename = path.basename(requestPath);
      const match = filename.match(/^report-(\d+)\.pdf$/);
      return match ? parseInt(match[1], 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Ensure PDF exists for an assessment, regenerating if necessary
   * Uses mutex to prevent duplicate regeneration from concurrent requests
   */
  static async ensurePdfForAssessment(assessmentId: number): Promise<RecoveryResult> {
    // Check if recovery is already in progress for this assessment
    const existingRecovery = this.recoveryInProgress.get(assessmentId);
    if (existingRecovery) {
      console.log(`[PDF Recovery] Recovery already in progress for assessment ${assessmentId}, waiting...`);
      return existingRecovery;
    }

    // Start new recovery and store promise
    const recoveryPromise = this.performRecovery(assessmentId);
    this.recoveryInProgress.set(assessmentId, recoveryPromise);

    try {
      const result = await recoveryPromise;
      return result;
    } finally {
      // Clean up the mutex
      this.recoveryInProgress.delete(assessmentId);
    }
  }

  /**
   * Perform the actual PDF recovery operation
   */
  private static async performRecovery(assessmentId: number): Promise<RecoveryResult> {
    try {
      console.log(`[PDF Recovery] Starting recovery for assessment ${assessmentId}`);

      // Step 1: Load assessment with survey data
      const assessment = await this.assessmentRepository.getWithSurveyInfo(assessmentId);
      
      if (!assessment) {
        return {
          success: false,
          error: "Assessment not found",
          reason: "NO_ASSESSMENT"
        };
      }

      // Step 2: Verify assessment is completed and has recommendations
      if (assessment.status !== "completed") {
        return {
          success: false,
          error: "Assessment is not completed",
          reason: "NOT_COMPLETED"
        };
      }

      if (!assessment.recommendations) {
        return {
          success: false,
          error: "Assessment has no recommendations to generate PDF from",
          reason: "NO_RECOMMENDATIONS"
        };
      }

      if (!assessment.answers || assessment.answers.length === 0) {
        return {
          success: false,
          error: "Assessment has no answers",
          reason: "NO_ANSWERS"
        };
      }

      if (!assessment.survey || !assessment.survey.questions || assessment.survey.questions.length === 0) {
        return {
          success: false,
          error: "Survey questions not available",
          reason: "NO_QUESTIONS"
        };
      }

      console.log(`[PDF Recovery] Assessment ${assessmentId} data validated, regenerating PDF...`);

      // Step 3: Determine user context (authenticated user or guest)
      let userId: number | undefined;
      let guestEmail: string | undefined;
      let companyName: string | undefined;

      if (assessment.userId) {
        userId = assessment.userId;
        // Get company name from user via UserService
        try {
          const user = await UserService.getById(userId);
          companyName = user?.company;
        } catch (error) {
          console.error("[PDF Recovery] Failed to get user company:", error);
        }
      } else if (assessment.guest) {
        try {
          const guestData = typeof assessment.guest === 'string' 
            ? JSON.parse(assessment.guest) 
            : assessment.guest;
          guestEmail = guestData?.email;
          companyName = guestData?.company;
        } catch (error) {
          console.error("[PDF Recovery] Failed to parse guest data:", error);
          return {
            success: false,
            error: "Invalid guest data",
            reason: "INVALID_GUEST_DATA"
          };
        }
      }

      // Step 4: Regenerate PDF
      const pdfResult = await PDFGenerator.generateAndSavePDF(
        assessment as any,
        userId,
        guestEmail,
        companyName
      );

      if (!pdfResult.success || !pdfResult.filePath || !pdfResult.relativePath) {
        console.error(`[PDF Recovery] PDF generation failed for assessment ${assessmentId}:`, pdfResult.error);
        return {
          success: false,
          error: pdfResult.error || "PDF generation failed",
          reason: "GENERATION_FAILED"
        };
      }

      console.log(`[PDF Recovery] PDF regenerated successfully: ${pdfResult.relativePath}`);

      // Step 5: Update database with new path
      await this.assessmentRepository.update(assessmentId, {
        pdfPath: pdfResult.relativePath
      });

      console.log(`[PDF Recovery] Database updated with new PDF path for assessment ${assessmentId}`);

      return {
        success: true,
        filePath: pdfResult.filePath,
        relativePath: pdfResult.relativePath
      };

    } catch (error) {
      console.error(`[PDF Recovery] Unexpected error during recovery for assessment ${assessmentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown recovery error",
        reason: "UNEXPECTED_ERROR"
      };
    }
  }

  /**
   * Check if a PDF needs recovery and perform it if necessary
   * Returns the file path if available (existing or recovered)
   */
  static async checkAndRecover(requestPath: string): Promise<{
    needsRecovery: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // Remove leading slash to prevent path.join from treating it as absolute
      const cleanPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath;
      const fullPath = path.join(getProjectRoot(), "public", cleanPath);
      
      if (fs.existsSync(fullPath)) {
        return {
          needsRecovery: false,
          filePath: fullPath
        };
      }

      console.log(`[PDF Recovery] File not found: ${fullPath}, attempting recovery...`);

      // Try to find assessment by PDF path first (for new format filenames)
      let assessmentId: number | null = null;
      
      // Convert to relative path format (e.g., /uploads/123/company-2025-11-16.pdf)
      const relativePath = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
      const assessmentByPath = await this.assessmentRepository.getByPdfPath(relativePath);
      
      if (assessmentByPath) {
        assessmentId = assessmentByPath.id;
        console.log(`[PDF Recovery] Found assessment ${assessmentId} by pdfPath lookup`);
      } else {
        // Fall back to legacy regex extraction for old filenames (report-{id}.pdf)
        assessmentId = this.extractAssessmentIdFromPath(requestPath);
        if (assessmentId) {
          console.log(`[PDF Recovery] Found assessment ${assessmentId} by legacy filename parsing`);
        }
      }
      
      if (!assessmentId) {
        return {
          needsRecovery: false,
          error: "Could not find assessment for this PDF"
        };
      }

      // Attempt recovery
      const recoveryResult = await this.ensurePdfForAssessment(assessmentId);

      if (recoveryResult.success && recoveryResult.filePath) {
        return {
          needsRecovery: true,
          filePath: recoveryResult.filePath
        };
      }

      return {
        needsRecovery: true,
        error: recoveryResult.error || "Recovery failed"
      };

    } catch (error) {
      console.error("[PDF Recovery] Error in checkAndRecover:", error);
      return {
        needsRecovery: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
