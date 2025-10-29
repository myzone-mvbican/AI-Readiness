import { ApiResponse } from "@shared/types/api-standard"; 

// Shared error handling function
export async function extractErrorMessage(response: Response): Promise<string> {
  const errorText = await response.text();
  // Try to parse the error response as JSON to extract the error message
  let errorMessage = errorText;

  try {
    const errorJson = JSON.parse(errorText);
    // Handle our standardized error format: { success: false, error: { code, message } }
    if (errorJson.error && errorJson.error.message) {
      errorMessage = errorJson.error.message;
    } else if (errorJson.message) {
      errorMessage = errorJson.message;
    } else {
      errorMessage = errorText;
    }
  } catch {
    errorMessage = errorText;
  }

  return errorMessage;
}