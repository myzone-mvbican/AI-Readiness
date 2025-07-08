import { promises as fs } from 'fs';
import path from 'path';

export class FileStorageService {
  private baseUploadPath = 'uploads';

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async saveAssessmentPDF(userId: string, assessmentId: number, pdfBuffer: Buffer): Promise<string> {
    const timestamp = Date.now();
    const filename = `assessment-${assessmentId}-${timestamp}.pdf`;
    const userDir = path.join(this.baseUploadPath, userId);
    const filePath = path.join(userDir, filename);

    // Ensure user directory exists
    await this.ensureDirectoryExists(userDir);

    // Save the PDF file
    await fs.writeFile(filePath, pdfBuffer);

    return filePath;
  }

  async deleteAssessmentPDF(pdfPath: string): Promise<void> {
    try {
      await fs.unlink(pdfPath);
    } catch (error) {
      console.warn(`Failed to delete PDF file: ${pdfPath}`, error);
    }
  }

  async getPDFBuffer(pdfPath: string): Promise<Buffer> {
    return await fs.readFile(pdfPath);
  }

  getPDFUrl(pdfPath: string): string {
    // Convert file path to URL path
    return `/api/files/${pdfPath.replace(/\\/g, '/')}`;
  }
}

export const fileStorage = new FileStorageService();