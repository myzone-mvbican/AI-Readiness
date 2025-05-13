import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { GuestAssessmentForm } from "./guest-assessment-form";
import { useToast } from "@/hooks/use-toast";
import { AssessmentQuestions } from "@/components/survey/assessment-questions";
import { AssessmentCompletion } from "@/components/survey/assessment-completion";
import { AssessmentAnswer } from "@shared/types";

interface GuestUser {
  name: string;
  email: string;
  company?: string;
}

enum AssessmentStage {
  INFO_COLLECTION,
  SURVEY_QUESTIONS,
  COMPLETED,
}

interface GuestAssessmentProps {
  onClose?: () => void;
}

export function GuestAssessment({ onClose }: GuestAssessmentProps) {
  const [stage, setStage] = useState<AssessmentStage>(
    AssessmentStage.INFO_COLLECTION,
  );
  const { toast } = useToast();
  
  // Try to load guest user info from localStorage
  const [guestUser, setGuestUser] = useState<GuestUser | null>(() => {
    try {
      const saved = localStorage.getItem("guestUser");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<any | null>(null);
  const [questionData, setQuestionData] = useState<any | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  
  // Default survey template ID
  const defaultSurveyId = 19;
  // Generate a unique guest user ID for localStorage
  const [guestUserId] = useState<string>(() => {
    const existingId = localStorage.getItem("guestUserId");
    if (existingId) return existingId;
    
    const newId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("guestUserId", newId);
    return newId;
  });

  // Check for saved answers in localStorage
  const [hasSavedAnswers, setHasSavedAnswers] = useState<boolean>(() => {
    if (guestUserId) {
      const savedAnswers = localStorage.getItem(`guest-assessment-${guestUserId}-${defaultSurveyId}`);
      return !!savedAnswers;
    }
    return false;
  });
  
  // State to track if we're showing the resume dialog
  const [showResumeDialog, setShowResumeDialog] = useState<boolean>(false);
  
  // Auto-advance to survey questions if user info already exists
  useEffect(() => {
    if (guestUser && stage === AssessmentStage.INFO_COLLECTION) {
      if (hasSavedAnswers) {
        // Show resume dialog instead of auto-advancing
        setShowResumeDialog(true);
      } else {
        setStage(AssessmentStage.SURVEY_QUESTIONS);
      }
    }
  }, [guestUser, stage, hasSavedAnswers]);

  // Load survey data when entering the survey questions stage
  useEffect(() => {
    if (stage === AssessmentStage.SURVEY_QUESTIONS && !surveyData) {
      fetchSurveyData();
    }
  }, [stage, surveyData]);

  const fetchSurveyData = async () => {
    setIsLoading(true);
    try {
      // Use the public endpoint that doesn't require authentication
      const surveyResponse = await fetch(
        `/api/public/surveys/detail/${defaultSurveyId}`,
      );
      const surveyData = await surveyResponse.json();

      if (surveyData.success && surveyData.survey) {
        setSurveyData(surveyData.survey);

        // Also fetch the questions for this survey
        try {
          const questionsResponse = await fetch(
            `/api/public/surveys/${defaultSurveyId}/questions`
          );
          const questionsData = await questionsResponse.json();
          
          if (questionsData.success) {
            setQuestionData(questionsData);
          }
        } catch (questionsError) {
          console.error("Error fetching questions:", questionsError);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load survey data. Please try again.",
          variant: "destructive",
        });
        // Go back to info collection stage
        setStage(AssessmentStage.INFO_COLLECTION);
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast({
        title: "Error",
        description: "Failed to load survey data. Please try again.",
        variant: "destructive",
      });
      // Go back to info collection stage
      setStage(AssessmentStage.INFO_COLLECTION);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoSubmit = (values: GuestUser) => {
    setGuestUser(values);
    // Store guest user info in localStorage for persistence
    localStorage.setItem("guestUser", JSON.stringify(values));
    // Move to survey questions stage
    setStage(AssessmentStage.SURVEY_QUESTIONS);
  };

  const handleQuestionsSubmit = async (answers: AssessmentAnswer[]) => {
    setIsLoading(true);
    setAnswers(answers);

    try {
      // Calculate a simple score based on answers
      const score = calculateScore(answers);

      // Create assessment result data for local storage and display
      const assessmentResult: {
        id?: number;
        title: string;
        email?: string;
        name?: string;
        company?: string;
        surveyTemplateId: number;
        answers: AssessmentAnswer[];
        status: string;
        score: number;
      } = {
        title: `${guestUser?.name}'s AI Readiness Assessment`,
        email: guestUser?.email,
        name: guestUser?.name,
        company: guestUser?.company,
        surveyTemplateId: defaultSurveyId,
        answers: answers,
        status: "completed",
        score,
      };

      // Save to server using the public API
      const response = await fetch('/api/public/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${guestUser?.name}'s AI Readiness Assessment`,
          surveyId: defaultSurveyId,
          email: guestUser?.email,
          name: guestUser?.name,
          company: guestUser?.company || '',
          answers: answers,
          status: "completed",
          score,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save assessment');
      }

      // Store both server ID and local copy
      if (data.assessment?.id) {
        assessmentResult.id = data.assessment.id;
      }

      // Set assessment result to be used in the completion stage
      setAssessmentResult(assessmentResult);

      // Move to completed stage
      setStage(AssessmentStage.COMPLETED);

      // Store result in localStorage
      localStorage.setItem("guestAssessment", JSON.stringify(assessmentResult));
      
      // Clear the answers from localStorage now that we've saved it
      if (guestUserId) {
        localStorage.removeItem(`guest-assessment-${guestUserId}-${defaultSurveyId}`);
      }
      
      toast({
        title: "Assessment Completed",
        description: "Your assessment has been saved successfully.",
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate score
  // Load saved answers from localStorage
  const loadSavedAnswers = (): AssessmentAnswer[] => {
    if (guestUserId) {
      try {
        const savedData = localStorage.getItem(`guest-assessment-${guestUserId}-${defaultSurveyId}`);
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
    }
    return [];
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Render the appropriate content based on current stage
  const renderContent = () => {
    switch (stage) {
      case AssessmentStage.INFO_COLLECTION:
        return (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Start Your AI Readiness Assessment</CardTitle>
              <CardDescription>
                Complete this quick survey to evaluate your organization's AI
                readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuestAssessmentForm
                onSubmit={handleInfoSubmit}
                isLoading={isLoading}
                onCancel={onClose}
              />
            </CardContent>
          </Card>
        );

      case AssessmentStage.SURVEY_QUESTIONS:
        return (
          <div className="w-full max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading survey questions...</span>
              </div>
            ) : surveyData ? (
              <AssessmentQuestions
                surveyData={surveyData}
                initialAnswers={loadSavedAnswers()}
                onSubmit={handleQuestionsSubmit}
                onCancel={() => setStage(AssessmentStage.INFO_COLLECTION)}
                guestUserId={guestUserId}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p>Failed to load survey. Please try again.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setStage(AssessmentStage.INFO_COLLECTION)}
                  >
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case AssessmentStage.COMPLETED:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <AssessmentCompletion
              assessment={assessmentResult}
              survey={{
                ...surveyData,
                questions: questionData?.questions || []
              }}
              guestMode={true}
              onSignUp={() => {
                window.location.href = "/auth?mode=register";
              }}
              onStartNew={() => {
                // Reset assessment state
                setGuestUser(null);
                setAnswers([]);
                setAssessmentResult(null);
                setSurveyData(null);
                // Clear localStorage
                if (guestUserId) {
                  localStorage.removeItem(`guest-assessment-${guestUserId}-${defaultSurveyId}`);
                }
                // Return to beginning
                setStage(AssessmentStage.INFO_COLLECTION);
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleLoadPreviousAnswers = () => {
    if (guestUserId) {
      setShowResumeDialog(false);
      setStage(AssessmentStage.SURVEY_QUESTIONS);
    }
  };
  
  const handleStartFresh = () => {
    if (guestUserId) {
      // Clear previous answers from localStorage
      localStorage.removeItem(`guest-assessment-${guestUserId}-${defaultSurveyId}`);
      setHasSavedAnswers(false);
      setShowResumeDialog(false);
      setStage(AssessmentStage.SURVEY_QUESTIONS);
    }
  };

  return (
    <div className="w-full pt-4">
      {renderContent()}
      
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
    </div>
  );
}
