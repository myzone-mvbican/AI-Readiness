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
  const defaultSurveyId = 19;

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
  const [currentScore, setCurrentScore] = useState<number>(0);

  const handleQuestionsSubmit = async (answers: AssessmentAnswer[]) => {
    try {
      // Use the live-calculated score that's been tracked as the user answers questions
      const score = currentScore > 0 ? currentScore : calculateScore(answers);

      // Create assessment result data for local storage and display
      const assessmentResult: {
        title: string;
        email?: string;
        surveyId: number;
        answers: AssessmentAnswer[];
        status: string;
        score: number;
      } = {
        title: `${guestUser?.company || guestUser?.name}'s AI Readiness Assessment`,
        email: guestUser?.email,
        surveyId: defaultSurveyId,
        answers: answers,
        status: "completed",
        score,
      };

      // Save to server using the public API
      const response = await fetch("/api/public/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentResult),
      });

      const { success, assessment, message } = await response.json();

      if (!success) {
        throw new Error(message || "Failed to save assessment");
      }

      // Move to completed stage
      setSurveyData(assessment);
      setStage(AssessmentStage.COMPLETED);

      // Clear the answers from localStorage now that we've saved it
      clearGuestAssessmentDataForSurvey(defaultSurveyId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
    }
  };

  const calculateScore = (answers: AssessmentAnswer[]): number => {
    // Simple scoring algorithm
    const validAnswers = answers.filter(
      (a) => a.a !== undefined && a.a !== null,
    );
    if (validAnswers.length === 0) return 0;

    const total = validAnswers.reduce((sum, answer) => {
      return sum + (answer.a || 0);
    }, 0);

    // Convert to 0-100 scale (normalize from -2 to 2 range)
    const normalized = (total / (validAnswers.length * 2) + 1) * 50;
    return Math.round(normalized);
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
            questions={questionData}
            setQuestions={setQuestionData}
            guestUser={guestUser}
            onSubmit={handleQuestionsSubmit}
            onCancel={backToInfoCollection}
            onScoreChange={(score: number) => {
              // Update the current score in real time as user selects answers
              setCurrentScore(score);
            }}
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
