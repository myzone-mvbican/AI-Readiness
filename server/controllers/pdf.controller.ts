import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { ApiResponseUtil } from "../utils/api-response";
import { AssessmentModel } from "../models/assessment.model";
import "../middleware/pdf-upload"; // Initialize PDF directories

// Schema for PDF generation request
const pdfGenerationSchema = z.object({
  pdfBlob: z.string(), // Base64 encoded PDF data
});

export class PDFController {
  static async generateAndSave(req: Request, res: Response) {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!assessmentId) {
        return ApiResponseUtil.legacy.error(res, "Assessment ID is required", 400);
      }

      // Get the assessment to verify ownership
      const assessment = await AssessmentModel.getById(assessmentId);
      if (!assessment) {
        return ApiResponseUtil.legacy.error(res, "Assessment not found", 404);
      }

      // Verify ownership for authenticated users
      if (userId && assessment.userId !== userId) {
        return ApiResponseUtil.legacy.error(res, "Unauthorized", 403);
      }

      // Validate request body
      const { pdfBlob } = pdfGenerationSchema.parse(req.body);

      // Create user directory if it doesn't exist
      const userDir = path.join(process.cwd(), 'public', 'uploads', 
        userId ? userId.toString() : 'guest', 'pdf');
      
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `assessment-${assessmentId}-${timestamp}.pdf`;
      const filePath = path.join(userDir, filename);

      // Convert base64 to buffer and save file
      const pdfBuffer = Buffer.from(pdfBlob, 'base64');
      fs.writeFileSync(filePath, pdfBuffer);

      // Create relative path for database storage
      const relativePath = path.join('uploads', 
        userId ? userId.toString() : 'guest', 'pdf', filename);

      // Update assessment with PDF path
      await AssessmentModel.update(assessmentId, {
        pdfPath: relativePath
      });

      return ApiResponseUtil.legacy.success(res, {
        message: "PDF saved successfully",
        pdfPath: relativePath,
        assessmentId
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      
      if (error instanceof z.ZodError) {
        return ApiResponseUtil.legacy.error(res, "Invalid request data", 400);
      }
      
      return ApiResponseUtil.legacy.error(res, "Failed to save PDF", 500);
    }
  }
}