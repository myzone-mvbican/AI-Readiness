import path from 'path';
import fs from 'fs';

// Create directories for PDF storage
export function ensurePDFDirectories() {
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create base uploads directory
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Create guest PDF directory
  const guestPDFDir = path.join(baseDir, 'guest', 'pdf');
  if (!fs.existsSync(guestPDFDir)) {
    fs.mkdirSync(guestPDFDir, { recursive: true });
  }
}

// Initialize directories on module load
ensurePDFDirectories();