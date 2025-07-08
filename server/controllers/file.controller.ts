import { Request, Response } from "express";
import { fileStorage } from "../utils/file-storage";
import { AssessmentModel } from "../models/assessment.model";
import path from "path";

export class FileController {
  static async servePDF(req: Request, res: Response) {
    try {
      const filePath = req.params[0]; // Get the full path from the wildcard route
      
      if (!filePath || !filePath.endsWith('.pdf')) {
        return res.status(400).json({
          success: false,
          message: "Invalid file path",
        });
      }

      // Security: Ensure the file path is within the uploads directory
      const fullPath = path.resolve(filePath);
      const uploadsPath = path.resolve('uploads');
      
      if (!fullPath.startsWith(uploadsPath)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Extract user ID from the path (uploads/userId/filename.pdf)
      const pathParts = filePath.split('/');
      if (pathParts.length < 3 || pathParts[0] !== 'uploads') {
        return res.status(400).json({
          success: false,
          message: "Invalid file path format",
        });
      }

      const fileUserId = pathParts[1];
      const requestUserId = req.user?.id?.toString();

      // Verify that the user can access this file
      if (fileUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this file",
        });
      }

      // Get the PDF buffer
      const pdfBuffer = await fileStorage.getPDFBuffer(filePath);

      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
      
      // Send the PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Error serving PDF:", error);
      
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to serve file",
      });
    }
  }
}