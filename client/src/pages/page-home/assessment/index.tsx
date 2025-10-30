import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AssessmentAnswer } from "@shared/types";
// Screens components
import ScreenForm from "./screen-form";
import ScreenSurvey from "./screen-survey";
import ScreenCompleted from "./screen-completed";
// Dialog components
import DialogResume from "./dialog-resume";
import {
  getGuestUser,
  saveGuestUser,
  GuestUser as StorageGuestUser,
  hasSavedGuestAssessment,
  clearGuestAssessmentDataForSurvey,
  clearGuestAssessmentData,
} from "@/lib/localStorage";

export enum AssessmentStage {
  INFO_COLLECTION,
  SURVEY_QUESTIONS,
  COMPLETED,
}

interface GuestAssessmentProps {
  onClose?: () => void;
}

export function GuestAssessment({ onClose }: GuestAssessmentProps) {
  const { toast } = useToast();

  // Default survey template ID
  const defaultSurveyId = 1;

  // Current stage of the assessment process
  const [stage, setStage] = useState<AssessmentStage>(
    AssessmentStage.INFO_COLLECTION,
  );

  // Load guest user info from localStorage using our utility
  const [guestUser, setGuestUser] = useState<StorageGuestUser | null>(() => {
    return getGuestUser();
  });

  // Check for saved answers in localStorage using our utility
  const [hasSavedAnswers, setHasSavedAnswers] = useState<boolean>(() => {
    return hasSavedGuestAssessment(defaultSurveyId);
  });

  const [showResumeDialog, setShowResumeDialog] = useState(hasSavedAnswers);
  const [surveyData, setSurveyData] = useState<any | null>(null);
  const [questionData, setQuestionData] = useState<any>([]);

  const handleQuestionsSubmit = async (answers: AssessmentAnswer[]) => {
    try {
      // Create assessment result data for local storage and display
      const assessmentResult: {
        title: string;
        guestData: any;
        surveyId: string;
        answers: AssessmentAnswer[];
        status: string;
      } = {
        title: `${guestUser?.company || guestUser?.name}'s AI Readiness Assessment`,
        guestData: guestUser, // Send the complete guest user data
        surveyId: defaultSurveyId.toString(), // Convert to string for validation
        answers: answers,
        status: "completed",
      };

      // Save to server using the public API
      const response = await fetch("/api/public/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentResult),
      });

      const { success, data, error } = await response.json();

      if (!success) {
        throw new Error(error?.message || "Failed to save assessment");
      }

      // Move to completed stage
      setSurveyData(data.assessment);
      setStage(AssessmentStage.COMPLETED);

      // Clear the answers from localStorage now that we've saved it
      clearGuestAssessmentDataForSurvey(defaultSurveyId);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
    }
  };

  const backToInfoCollection = () => {
    // Go back to info collection stage and clear ALL guest data (not just survey data)
    clearGuestAssessmentData(); // Clear all guest data including user info
    setGuestUser(null); // Reset guest user state
    setHasSavedAnswers(false); // Reset saved answers state
    setStage(AssessmentStage.INFO_COLLECTION);
  };

  // Render the appropriate content based on current stage
  const renderContent = () => {
    switch (stage) {
      case AssessmentStage.INFO_COLLECTION:
        return (
          <ScreenForm
            setGuestUser={setGuestUser}
            saveGuestUser={saveGuestUser}
            setStage={setStage}
            onCancel={onClose}
          />
        );

      case AssessmentStage.SURVEY_QUESTIONS:
        return (
          <ScreenSurvey
            surveyId={defaultSurveyId}
            guestUser={guestUser}
            questions={questionData}
            setQuestions={setQuestionData}
            onSubmit={handleQuestionsSubmit}
            onCancel={backToInfoCollection}
          />
        );

      case AssessmentStage.COMPLETED:
        return (
          <ScreenCompleted
            assessment={surveyData}
            questions={questionData}
            guestUser={guestUser}
            setStage={setStage}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderContent()}

      {/* Resume stored assessment */}
      <DialogResume
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onCancel={backToInfoCollection}
        onSubmit={() => {
          // Just resume without clearing
          setShowResumeDialog(false);
          setStage(AssessmentStage.SURVEY_QUESTIONS);
        }}
      />
    </>
  );
}
