import { useState } from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { Assessment, AssessmentAnswer } from "@shared/types";

import SurveyQuestion from "@/components/survey/survey-question";

interface SurveyQuestion {
  number: number;
  text: string;
  description: string;
  category: string;
}

interface SurveyTemplateProps {
  // Assessment data
  assessment: Partial<Assessment> & { 
    survey?: { title: string },
    title?: string,
    status?: string,
    updatedAt?: string
  };
  surveyTitle?: string; // For guest mode where data might not have nested survey property
  
  // Questions and answers
  questions: SurveyQuestion[];
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
  setCurrentStep: externalSetCurrentStep
}: SurveyTemplateProps) {
  // Use either externally controlled step state or internal state
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);
  
  const currentStep = externalCurrentStep !== undefined ? externalCurrentStep : internalCurrentStep;
  const setCurrentStep = externalSetCurrentStep || setInternalCurrentStep;
  
  // No local dialog state - we'll rely on parent component
  
  // Calculate progress - percentage of questions answered
  const answeredQuestions = answers.filter(a => a.a !== null && a.a !== undefined).length;
  const currentProgress = Math.round((answeredQuestions / questions.length) * 100);
  
  // Check if all questions have been answered
  const allQuestionsAnswered = () => {
    return answers.every(answer => answer.a !== null && answer.a !== undefined);
  };
  
  // Format date for display
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Unknown";
    }
  };
  
  // Get the status badge - in progress or completed
  const getStatusBadge = () => {
    const status = assessment.status || "in-progress";
    
    if (status === "completed") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        In Progress
      </Badge>
    );
  };
  
  // Handle the answer change and update the answers array
  const updateAnswer = (index: number, value: number) => {
    if (onAnswerChange) {
      onAnswerChange(index, value);
    }
  };
  
  // Handle open completion dialog directly through parent callback
  const handleComplete = () => {
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

  // Get assessment title and survey title
  const assessmentTitle = assessment?.title || "Assessment";
  const displaySurveyTitle = assessment?.survey?.title || surveyTitle || "Survey";
  
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
                Last Updated: {getFormattedDate(assessment.updatedAt?.toString() || '')}
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
              onClick={() => setCurrentStep(Math.min(questions.length - 1, currentStep + 1))}
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
              {questions[currentStep]?.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2 max-w-[400px]">
                    {questions[currentStep]?.description}
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
            <CardDescription className="text-sm md:text-lg md:text-xl text-foreground font-bold">
              <p>
                "{questions[currentStep]?.text || `Question ${currentStep + 1}`}"
              </p>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <SurveyQuestion
              question={questions[currentStep]?.text || ""}
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
              onClick={() => setCurrentStep(Math.min(questions.length - 1, currentStep + 1))}
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
              {isGuestMode ? (
                "Your answers are auto-saved as you go. To finalize your assessment, answer all questions and click 'Complete Assessment'. You can create an account after completion to track your progress over time."
              ) : (
                "Your answers are saved when you click 'Save Progress'. To finalize your assessment, answer all questions and click 'Complete Assessment'. Completed assessments cannot be modified."
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between border-t py-4">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <div className="flex gap-2">
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
    </div>
  );
}
