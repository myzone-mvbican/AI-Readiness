/**
 * Centralized localStorage management for the application
 * Helps prevent fragmentation and inconsistencies across storage keys
 */

import { AssessmentAnswer } from "@shared/types";

// Main storage keys
export const STORAGE_KEYS = {
  // Auth related
  TOKEN: "token",
  USER_DATA: "userData",
  SELECTED_TEAM: "selectedTeam",

  // Guest assessment related
  GUEST_USER: "guestUser",
  GUEST_ASSESSMENT_DATA: "guestAssessmentData", // New consolidated key
  GUEST_ASSESSMENT_RESULT: "guestAssessmentResult",
};

// Guest user interface with embedded ID
export interface GuestUser {
  id: string;
  name: string;
  email: string;
  company: string;
  employeeCount: string;
  industry: string;
}

// Guest assessment data interface
export interface GuestAssessmentData {
  surveyId: number;
  answers: AssessmentAnswer[];
  lastUpdated: string;
  currentStep?: number;
}

/**
 * Generate a unique guest user ID
 */
export function generateGuestUserId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Save guest user information to localStorage with embedded ID
 * @returns The complete guest user object with ID
 */
export function saveGuestUser(user: Omit<GuestUser, "id">): GuestUser {
  // Get existing user or create new with ID
  let guestUser: GuestUser;

  try {
    const existingData = localStorage.getItem(STORAGE_KEYS.GUEST_USER);

    if (existingData) {
      // Update existing user data
      const existingUser = JSON.parse(existingData);
      guestUser = {
        ...existingUser,
        ...user,
      };
    } else {
      // Create new user with generated ID
      guestUser = {
        id: generateGuestUserId(),
        ...user,
      };
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.GUEST_USER, JSON.stringify(guestUser));
    return guestUser;
  } catch (e) {
    console.error("Error saving guest user data:", e);
    // Create a new user if there was an error
    guestUser = {
      id: generateGuestUserId(),
      ...user,
    };
    localStorage.setItem(STORAGE_KEYS.GUEST_USER, JSON.stringify(guestUser));
    return guestUser;
  }
}

/**
 * Get guest user information from localStorage
 */
export function getGuestUser(): GuestUser | null {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.GUEST_USER);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Error loading guest user data:", e);
    return null;
  }
}

/**
 * Get the guest user ID from localStorage
 * @returns The ID if a guest user exists, null otherwise
 */
export function getGuestUserId(): string | null {
  const guestUser = getGuestUser();
  return guestUser?.id || null;
}

/**
 * Get guest assessment data from localStorage
 */
export function getGuestAssessmentData(
  surveyId: number,
): GuestAssessmentData | null {
  try {
    const allData = localStorage.getItem(STORAGE_KEYS.GUEST_ASSESSMENT_DATA);
    if (!allData) return null;

    const parsedData = JSON.parse(allData) as Record<
      number,
      GuestAssessmentData
    >;
    return parsedData[surveyId] || null;
  } catch (e) {
    console.error("Error loading guest assessment data:", e);
    return null;
  }
}

/**
 * Save guest assessment data to localStorage
 */
export function saveGuestAssessmentData(
  surveyId: number,
  data: Partial<GuestAssessmentData>,
): void {
  try {
    // Get existing data
    const allData = localStorage.getItem(STORAGE_KEYS.GUEST_ASSESSMENT_DATA);
    const parsedData = allData ? JSON.parse(allData) : {};

    // Update with new data
    parsedData[surveyId] = {
      ...parsedData[surveyId],
      ...data,
      surveyId,
      lastUpdated: new Date().toISOString(),
    };

    // Save back to localStorage
    localStorage.setItem(
      STORAGE_KEYS.GUEST_ASSESSMENT_DATA,
      JSON.stringify(parsedData),
    );
  } catch (e) {
    console.error("Error saving guest assessment data:", e);
  }
}

/**
 * Save guest assessment answers
 */
export function saveGuestAssessmentAnswers(
  surveyId: number,
  answers: AssessmentAnswer[],
  currentStep?: number,
): void {
  saveGuestAssessmentData(surveyId, {
    answers,
    currentStep: currentStep !== undefined ? currentStep : undefined,
  });
}

/**
 * Check if there's a saved guest assessment in progress
 */
export function hasSavedGuestAssessment(surveyId: number): boolean {
  const data = getGuestAssessmentData(surveyId);
  return !!(
    data &&
    data.answers &&
    data.answers.some((answer) => answer.a !== null)
  );
}

/**
 * Save completed guest assessment result
 */
export function saveGuestAssessmentResult(result: any): void {
  localStorage.setItem(
    STORAGE_KEYS.GUEST_ASSESSMENT_RESULT,
    JSON.stringify(result),
  );
}

/**
 * Get completed guest assessment result
 */
export function getGuestAssessmentResult(): any | null {
  try {
    const result = localStorage.getItem(STORAGE_KEYS.GUEST_ASSESSMENT_RESULT);
    return result ? JSON.parse(result) : null;
  } catch (e) {
    console.error("Error loading guest assessment result:", e);
    return null;
  }
}

/**
 * Clear all guest assessment data
 */
export function clearGuestAssessmentData(): void {
  localStorage.removeItem(STORAGE_KEYS.GUEST_USER);
  localStorage.removeItem(STORAGE_KEYS.GUEST_ASSESSMENT_DATA);
  localStorage.removeItem(STORAGE_KEYS.GUEST_ASSESSMENT_RESULT);
}

/**
 * Clear all assessment data for a specific survey
 */
export function clearGuestAssessmentDataForSurvey(surveyId: number): void {
  try {
    const allData = localStorage.getItem(STORAGE_KEYS.GUEST_ASSESSMENT_DATA);
    if (!allData) return;

    const parsedData = JSON.parse(allData);
    if (parsedData[surveyId]) {
      delete parsedData[surveyId];
      localStorage.setItem(
        STORAGE_KEYS.GUEST_ASSESSMENT_DATA,
        JSON.stringify(parsedData),
      );
    }
  } catch (e) {
    console.error("Error clearing guest assessment data for survey:", e);
  }
}

/**
 * Clear all local storage related to authentication
 */
export function clearAuthData(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_TEAM);
}
