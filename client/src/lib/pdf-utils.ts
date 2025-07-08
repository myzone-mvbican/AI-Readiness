import { pdf } from "@react-pdf/renderer";
import { AssessmentPDF } from "@/components/survey/assessment-pdf";
import { apiRequest } from "./queryClient";
import { Assessment } from "@shared/types";

/**
 * Generate PDF blob from assessment data and save to server
 */
export async function generateAndSavePDF(assessment: Assessment): Promise<string> {
  try {
    // Generate PDF blob using react-pdf
    const blob = await pdf(<AssessmentPDF assessment={assessment} />).toBlob();
    
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const base64String = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Determine endpoint based on whether user is authenticated
    const isGuestAssessment = !assessment.userId;
    const endpoint = isGuestAssessment 
      ? `/api/public/assessments/${assessment.id}/pdf/generate`
      : `/api/assessments/${assessment.id}/pdf/generate`;
    
    // Send to server
    const response = await apiRequest('POST', endpoint, {
      pdfBlob: base64String
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save PDF');
    }
    
    return result.data.pdfPath;
    
  } catch (error) {
    console.error('Error generating and saving PDF:', error);
    throw error;
  }
}

/**
 * Check if PDF already exists for assessment
 */
export function hasPDF(assessment: Assessment): boolean {
  return !!assessment.pdfPath;
}

/**
 * Get PDF download URL
 */
export function getPDFUrl(assessment: Assessment): string | null {
  if (!assessment.pdfPath) return null;
  
  // Convert relative path to full URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/${assessment.pdfPath}`;
}