import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AssessmentAnswer } from "@shared/types";
import SurveyTemplate from "@/components/survey/survey-template";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getGuestAssessmentData,
  saveGuestAssessmentAnswers,
  clearGuestAssessmentDataForSurvey,
} from "@/lib/localStorage";

interface SurveyQuestion {
  number: number;
  text: string;
  description: string;
  detail?: string;
  category: string;
}

interface GuestSurveyProps {
  surveyId: number;
  guestUser: { id: string; name: string; email: string; company?: string };
  onSubmit: (answers: AssessmentAnswer[]) => void;
  onCancel?: () => void;
  onScoreChange?: (score: number) => void;
  hasSavedAnswers: boolean;
}

export default function GuestSurvey({
  surveyId,
  guestUser,
  onSubmit,
  onCancel,
  onScoreChange,
  hasSavedAnswers,
}: GuestSurveyProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(hasSavedAnswers);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Use a ref to track if we've already handled resuming
  const resumeHandled = useRef(false);

  // Fetch survey data using public API endpoint
  const { data: surveyData, isLoading: isSurveyLoading } = useQuery({
    queryKey: [`/api/public/surveys/detail/${surveyId}`],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch survey questions using public API endpoint
  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/public/surveys/${surveyId}/questions`],
    retry: false,
    enabled: !!surveyData?.success,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load saved answers from localStorage when available
  useEffect(() => {
    if (hasSavedAnswers && !resumeHandled.current) {
      const savedData = getGuestAssessmentData(surveyId);
      if (savedData?.answers?.length) {
        setAnswers(savedData.answers);
        if (savedData.currentStep !== undefined) {
          setCurrentStep(savedData.currentStep);
        }
        
        // Calculate and report the score from saved answers
        if (onScoreChange && savedData.answers.length > 0) {
          const score = calculateScore(savedData.answers);
          onScoreChange(score);
        }
        
        resumeHandled.current = true;
      }
    }
  }, [surveyId, hasSavedAnswers, onScoreChange]);

  // Format questions when data is loaded
  useEffect(() => {
    if (questionsData?.success && questionsData.questions) {
      // Map the questions to the format needed by SurveyTemplate
      const formattedQuestions = questionsData.questions.map((q: any) => ({
        number: q.id || q.number,
        text: q.question || q.text,
        description: q.description || q.detail || "", // Support both description and detail fields
        detail: q.detail || q.description || "",      // Handle either property name
        category: q.category || "General",
      }));
      setQuestions(formattedQuestions);

      // Initialize answers if none exist
      if (answers.length === 0) {
        const initialAnswers = formattedQuestions.map(
          (question: SurveyQuestion) => ({
            q: question.number,
            a: null,
          }),
        );
        setAnswers(initialAnswers);
      }
    }
  }, [questionsData, answers.length]);

  // Handle answer changes
  const handleAnswerChange = (index: number, value: number) => {
    const updatedAnswers = [...answers];

    // Find the corresponding answer object using the question number from questions[index]
    const questionNumber = questions[index]?.number;
    const answerIndex = updatedAnswers.findIndex((a) => a.q === questionNumber);

    if (answerIndex !== -1) {
      // Update existing answer
      updatedAnswers[answerIndex] = {
        ...updatedAnswers[answerIndex],
        a: value as any,
      };
    } else {
      // Add new answer
      updatedAnswers.push({ q: questionNumber, a: value as any });
    }

    // Update state
    setAnswers(updatedAnswers);

    // Save to localStorage
    saveGuestAssessmentAnswers(surveyId, updatedAnswers, currentStep);

    // Calculate and report score
    if (onScoreChange) {
      const score = calculateScore(updatedAnswers);
      onScoreChange(score);
    }

    // Clear any existing timeout
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
    }

    // Auto-advance after 500ms
    const timeout = setTimeout(() => {
      if (currentStep < questions.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveGuestAssessmentAnswers(surveyId, updatedAnswers, nextStep);
      }
    }, 500);

    setAutoAdvanceTimeout(timeout);
  };

  // Calculate a simple score from the answers
  const calculateScore = (answers: AssessmentAnswer[]): number => {
    const validAnswers = answers.filter(
      (a) => a.a !== null && a.a !== undefined,
    );
    if (validAnswers.length === 0) return 0;

    const total = validAnswers.reduce(
      (sum, answer) => sum + (answer.a || 0),
      0,
    );

    // Convert to 0-100 scale (normalize from -2 to 2 range)
    return Math.round((total / (validAnswers.length * 2) + 1) * 50);
  };

  // Handle completion
  const handleComplete = () => {
    // First save current answers
    saveGuestAssessmentAnswers(surveyId, answers, currentStep);

    // Then submit
    setIsSubmitting(true);

    // Calculate final score
    const score = calculateScore(answers);
    if (onScoreChange) {
      onScoreChange(score);
    }

    // Send answers to parent component
    onSubmit(answers);
  };

  // Handle cancellation
  const handleCancel = () => {
    if (onCancel) {
      // Clear saved data instead of saving
      clearGuestAssessmentDataForSurvey(surveyId);
      onCancel();
    }
  };

  // Handle resume dialog responses
  const handleResumeSurvey = () => {
    setShowResumeDialog(false);
  };

  const handleStartFresh = () => {
    // Clear saved data
    clearGuestAssessmentDataForSurvey(surveyId);

    // Reset answers
    if (questions.length > 0) {
      const freshAnswers = questions.map((question) => ({
        q: question.number,
        a: null,
      }));
      setAnswers(freshAnswers);
    } else {
      setAnswers([]);
    }

    // Reset step
    setCurrentStep(0);
    setShowResumeDialog(false);
    
    // Reset score if there's a callback
    if (onScoreChange) {
      onScoreChange(0);
    }
  };

  // Show loading state
  if (isSurveyLoading || isQuestionsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading survey...</span>
      </div>
    );
  }

  // Show error if data couldn't be loaded
  if (!surveyData?.success || !questionsData?.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Unable to load the assessment. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <>
      <SurveyTemplate
        assessment={{
          title: surveyData.survey.title,
          updatedAt: new Date().toISOString(),
          status: "in_progress",
        }}
        surveyTitle={surveyData.survey.title}
        questions={questions}
        answers={answers}
        isGuestMode={true}
        onAnswerChange={handleAnswerChange}
        isSubmitting={isSubmitting}
        showSaveButton={false}
        onCancel={handleCancel}
        onComplete={handleComplete}
        currentStep={currentStep}
        setCurrentStep={(step) => {
          setCurrentStep(step);
          saveGuestAssessmentAnswers(surveyId, answers, step);
        }}
      />

      {/* Resume Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Your Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              We found a previously started assessment. Would you like to resume
              where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeSurvey}>
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
