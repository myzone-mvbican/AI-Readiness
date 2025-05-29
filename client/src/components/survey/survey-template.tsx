import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Save,
  InfoIcon,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shuffle,
} from "lucide-react";
import {
  CsvQuestion,
  Assessment,
  AssessmentAnswer,
  Survey,
} from "@shared/types";

import SurveyQuestion from "@/components/survey/survey-question";
import AlertCompleted from "@/components/survey/alert-completed";
import { useAuth } from "@/hooks/use-auth";

interface SurveyTemplateProps {
  // Assessment data
  assessment: Assessment & {
    survey?: Survey;
  };
  surveyTitle?: string; // For guest mode where data might not have nested survey property

  // Questions and answers
  questions: CsvQuestion[];
  answers: AssessmentAnswer[];
  onAnswerChange: (index: number, value: number) => void;

  // UI state
  isSubmitting?: boolean;
  showSaveButton?: boolean;

  // Actions
  onCancel?: () => void;
  onSave?: () => void;
  onComplete?: () => void;

  // For internal navigation
  isGuestMode?: boolean;
  currentStep?: number;
  setCurrentStep?: (step: number) => void;
}

export default function SurveyTemplate({
  assessment,
  surveyTitle,
  questions = [],
  answers = [],
  onAnswerChange,
  isSubmitting = false,
  showSaveButton = true,
  onCancel,
  onSave,
  onComplete,
  isGuestMode = false,
  currentStep: externalCurrentStep,
  setCurrentStep: externalSetCurrentStep,
}: SurveyTemplateProps) {
  const { user } = useAuth();
  
  // Use either externally controlled step state or internal state
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);

  const currentStep =
    externalCurrentStep !== undefined
      ? externalCurrentStep
      : internalCurrentStep;
  const setCurrentStep = externalSetCurrentStep || setInternalCurrentStep;

  // State for completion dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Calculate progress - percentage of questions answered
  const answeredQuestions = answers.filter(
    (a) => a.a !== null && a.a !== undefined,
  ).length;
  const currentProgress = Math.round(
    (answeredQuestions / questions.length) * 100,
  );

  // Check if all questions have been answered
  const allQuestionsAnswered = () => {
    return answers.every(
      (answer) => answer.a !== null && answer.a !== undefined,
    );
  };

  // Get the status badge - in progress or completed
  const getStatusBadge = () => {
    const status = assessment.status || "draft";

    if (status === "completed") {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Completed
        </Badge>
      );
    }

    if (status === "in-progress") {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          In Progress
        </Badge>
      );
    }

    return <Badge variant="outline">Draft</Badge>;
  };

  // Handle the answer change and update the answers array
  const updateAnswer = (index: number, value: number) => {
    if (onAnswerChange) {
      onAnswerChange(index, value);
    }
  };

  // Handle open completion dialog
  const handleComplete = () => {
    setCompleteDialogOpen(true);
  };

  // Handle confirm complete
  const confirmComplete = () => {
    setCompleteDialogOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  // Handle save progress
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  // Handle random completion (admin only)
  const handleRandomCompletion = () => {
    // Generate random answers for all questions (-2 to 2)
    questions.forEach((question, index) => {
      const randomValue = Math.floor(Math.random() * 5) - 2; // Random number from -2 to 2
      onAnswerChange(index, randomValue);
    });

    // Use setTimeout to ensure all state updates are processed before jumping to the end
    setTimeout(() => {
      setCurrentStep(questions.length - 1);
    }, 100);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // Debug logging
  console.log('User object:', user);
  console.log('User role:', user?.role);
  console.log('Is admin:', isAdmin);

  // Get assessment title and survey title
  const assessmentTitle = assessment?.title || "Assessment";
  const displaySurveyTitle =
    assessment?.survey?.title || surveyTitle || "Survey";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
        <div className="col-span-1">
          <h2 className="text-2xl font-medium dark:text-white">
            {assessmentTitle}
          </h2>
          <p className="mt-2 mb-0 text-muted-foreground">
            Based on: {displaySurveyTitle}
          </p>
        </div>
        <div className="col-span-1 md:text-end">
          {getStatusBadge()}
          {assessment.updatedAt && (
            <p className="text-muted-foreground mt-2">
              <span className="text-sm text-muted-foreground">
                Last Updated:{" "}
                {formatDate(assessment.updatedAt?.toString() || "")}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-foreground font-medium">
            Completion Progress
          </span>
          <span className="text-sm font-medium text-foreground">
            {currentProgress}%
          </span>
        </div>
        <Progress value={currentProgress} className="h-2 text-foreground" />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
          <h2 className="text-xl font-bold text-foreground text-center md:text-start">
            {questions[currentStep]?.category || "Assessment questions"}
          </h2>
          <div className="flex justify-center md:justify-end items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {questions.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentStep(Math.min(questions.length - 1, currentStep + 1))
              }
              disabled={currentStep === questions.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        <Card className="border-2 border-muted">
          <CardHeader className="bg-muted">
            <CardTitle className="flex items-center space-x-3">
              <h3 className="text-xs md:text-sm text-muted-foreground">
                Question {currentStep + 1} of {questions.length}
              </h3>
              {questions[currentStep]?.details && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2 max-w-[400px]">
                    {questions[currentStep]?.details}
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
            <CardDescription className="text-sm md:text-lg md:text-xl text-foreground font-bold">
              <p>
                "
                {questions[currentStep]?.question ||
                  `Question ${currentStep + 1}`}
                "
              </p>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <SurveyQuestion
              value={answers[currentStep]?.a}
              onChange={(value) => updateAnswer(currentStep, value)}
              disabled={isSubmitting}
            />
          </CardContent>

          <CardFooter className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentStep(Math.min(questions.length - 1, currentStep + 1))
              }
              disabled={currentStep === questions.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Note</h4>
            <p className="text-sm text-yellow-700 mt-1">
              {isGuestMode
                ? "Your answers are auto-saved as you go. To finalize your assessment, answer all questions and click 'Complete Assessment'. You can create an account after completion to track your progress over time."
                : "Your answers are saved when you click 'Save Progress'. To finalize your assessment, answer all questions and click 'Complete Assessment'. Completed assessments cannot be modified."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between border-t py-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <div className="flex gap-2">
          {isAdmin && !isGuestMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleRandomCompletion}
                  disabled={isSubmitting}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Shuffle className="h-4 w-4" />
                  <div className="hidden md:block ms-2">Random</div>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                Admin only: Fill all questions with random answers (-2 to 2)
              </TooltipContent>
            </Tooltip>
          )}
          
          {showSaveButton && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <div className="hidden md:block ms-2">Save Progress</div>
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || !allQuestionsAnswered()}
                  className={!allQuestionsAnswered() ? "opacity-50" : ""}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <div className="hidden md:block ms-2">
                    Complete Assessment
                  </div>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent className="p-2">
              {!allQuestionsAnswered()
                ? "Please answer all questions to complete"
                : "Complete assessment and view results"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Confirmation Dialog for Completing Assessment */}
      <AlertCompleted
        completeDialogOpen={completeDialogOpen}
        setCompleteDialogOpen={setCompleteDialogOpen}
        isSubmitting={isSubmitting}
        confirmComplete={confirmComplete}
      />
    </div>
  );
}
