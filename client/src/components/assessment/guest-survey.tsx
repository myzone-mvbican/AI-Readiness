import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AssessmentAnswer } from "@shared/types";
import SurveyTemplate from "@/components/survey/survey-template";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  getGuestAssessmentData, 
  saveGuestAssessmentAnswers,
  clearGuestAssessmentDataForSurvey
} from "@/lib/localStorage";

interface SurveyQuestion {
  number: number;
  text: string;
  description: string;
  category: string;
}

interface GuestSurveyProps {
  surveyId: number;
  guestUserId: string;
  guestUser: { name: string; email: string; company?: string };
  onSubmit: (answers: AssessmentAnswer[]) => void;
  onCancel?: () => void;
  onScoreChange?: (score: number) => void;
  hasSavedAnswers: boolean;
}

export default function GuestSurvey({
  surveyId,
  guestUserId,
  guestUser,
  onSubmit,
  onCancel,
  onScoreChange,
  hasSavedAnswers
}: GuestSurveyProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(hasSavedAnswers);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate score from answers for reporting back to parent
  const calculateScore = (answers: AssessmentAnswer[]): number => {
    // Get only answered questions
    const answeredQuestions = answers.filter(q => q.a !== null && q.a !== undefined);
    
    if (answeredQuestions.length === 0) return 0;
    
    // Calculate raw score (sum of all answer values)
    const rawScore = answeredQuestions.reduce((sum, q) => sum + (q.a || 0), 0);
    
    // Calculate maximum possible score (2 * number of answered questions)
    const maxScore = answeredQuestions.length * 2;
    
    // Calculate percentage score (normalized from -2 to 2 range to 0 to 100)
    const normalizedScore = ((rawScore + (answeredQuestions.length * 2)) / (maxScore * 2)) * 100;
    
    // Round to nearest integer
    return Math.round(normalizedScore);
  };

  // Fetch survey data from the public API
  const { data: surveyData, isLoading: isSurveyLoading } = useQuery({
    queryKey: [`/api/public/surveys/detail/${surveyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/public/surveys/detail/${surveyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch survey data');
      }
      return response.json();
    },
  });

  // Fetch questions using React Query
  const { data: questionData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/public/surveys/${surveyId}/questions`],
    queryFn: async () => {
      const response = await fetch(`/api/public/surveys/${surveyId}/questions`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
    enabled: !!surveyId,
  });

  // Process the question data when it changes
  useEffect(() => {
    if (questionData?.success && questionData?.questions) {
      // Format questions to match our SurveyQuestion interface
      const formattedQuestions = questionData.questions
        .filter((q: any) => q.question && q.question.trim() !== "")
        .map((q: any, index: number) => ({
          number: q.id || index + 1,
          text: q.question,
          description: q.details || "Respond based on your organization's current situation, not aspirations",
          category: q.category || "AI Readiness Assessment"
        }));
      
      setQuestions(formattedQuestions);
      
      // Initialize answers if needed
      if (answers.length === 0) {
        const initialAnswers = formattedQuestions.map((q: SurveyQuestion) => ({
          q: q.number,
          a: null as null,
        }));
        setAnswers(initialAnswers);
      }
    }
  }, [questionData, answers.length]);

  // Load saved answers from localStorage - only run once when questions are loaded
  useEffect(() => {
    // Only run this once when questions are loaded
    if (hasSavedAnswers && questions.length > 0 && answers.length === 0) {
      const savedData = getGuestAssessmentData(surveyId);
      if (savedData?.answers && savedData.answers.length > 0) {
        setAnswers(savedData.answers);
        
        // Restore the current step if available
        if (savedData.currentStep !== undefined) {
          setCurrentStep(savedData.currentStep);
        }
      }
    }
  }, [hasSavedAnswers, questions.length, answers.length, surveyId]);

  // Clear auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
    };
  }, [autoAdvanceTimeout]);
  
  // Control resume dialog only on mount
  useEffect(() => {
    // Only show the resume dialog once on initial mount if there are saved answers
    if (hasSavedAnswers) {
      setShowResumeDialog(true);
    }
    // This effect should only run once on mount
  }, []);

  const handleAnswerChange = (index: number, value: number) => {
    // Create a copy of the answers array
    const updatedAnswers = [...answers];
    
    // Update the answer at the given index
    if (updatedAnswers[index]) {
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        a: value as -2 | -1 | 0 | 1 | 2 | null,
      };
    } else {
      // Create new answer if it doesn't exist
      updatedAnswers[index] = {
        q: questions[index]?.number || index + 1,
        a: value as -2 | -1 | 0 | 1 | 2 | null,
      };
    }
    
    // Update state
    setAnswers(updatedAnswers);
    
    // Notify parent of score change
    if (onScoreChange) {
      const score = calculateScore(updatedAnswers);
      onScoreChange(score);
    }
    
    // Save to localStorage using our new utility
    saveGuestAssessmentAnswers(surveyId, updatedAnswers, currentStep);
    
    // Automatically proceed to next question after a delay
    if (currentStep < questions.length - 1) {
      // Clear existing timeout if it exists
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        // Also save the updated step to localStorage
        saveGuestAssessmentAnswers(surveyId, updatedAnswers, nextStep);
      }, 500);
      
      setAutoAdvanceTimeout(timeout);
    }
  };

  const handleCancel = () => {
    // Clear localStorage before canceling using our new utility
    clearGuestAssessmentDataForSurvey(surveyId);
    
    if (onCancel) {
      onCancel();
    }
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    onSubmit(answers);
  };

  const handleLoadPreviousAnswers = () => {
    setShowResumeDialog(false);
  };
  
  const handleStartFresh = () => {
    // Clear previous answers from localStorage using our new utility
    clearGuestAssessmentDataForSurvey(surveyId);
    
    // Reset answers to empty
    const initialAnswers = questions.map((q: SurveyQuestion) => ({
      q: q.number,
      a: null as null,
    }));
    setAnswers(initialAnswers);
    setCurrentStep(0);
    setShowResumeDialog(false);
    
    // Signal parent component to go back to info collection
    if (onCancel) {
      onCancel();
    }
  };

  if (isSurveyLoading || isQuestionsLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading assessment...</span>
      </div>
    );
  }

  const survey = surveyData?.survey;
  
  if (!survey) {
    return (
      <div className="py-10 text-center">
        <p className="text-lg text-red-600">Failed to load assessment data.</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={onCancel}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Create a compatible assessment object for our SurveyTemplate
  const assessmentData = {
    id: 0, // Guest assessments don't have an ID until submitted
    title: `${guestUser.name}'s AI Readiness Assessment`,
    surveyTemplateId: surveyId,
    status: "in-progress",
    survey: { title: survey.title },
  };

  return (
    <>
      <SurveyTemplate
        assessment={assessmentData}
        surveyTitle={survey.title}
        questions={questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        isSubmitting={isSubmitting}
        showSaveButton={false}
        onCancel={handleCancel}
        onComplete={handleComplete}
        isGuestMode={true}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              We found a previously saved assessment for you. Would you like to resume where you left off, or start a new assessment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>Start New</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadPreviousAnswers}>Resume Previous</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}