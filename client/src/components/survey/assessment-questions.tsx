import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Check, Save, HelpCircle } from "lucide-react";
import { AssessmentAnswer } from "@shared/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function to calculate score from answers
function calculateScore(answers: AssessmentAnswer[]): number {
  // Get only answered questions
  const answeredQuestions = answers.filter(q => q.a !== null);
  
  if (answeredQuestions.length === 0) return 0;
  
  // Calculate raw score (sum of all answer values)
  const rawScore = answeredQuestions.reduce((sum, q) => sum + (q.a || 0), 0);
  
  // Calculate maximum possible score (2 * number of answered questions)
  const maxScore = answeredQuestions.length * 2;
  
  // Calculate percentage score (normalized from -2 to 2 range to 0 to 100)
  const normalizedScore = ((rawScore + (answeredQuestions.length * 2)) / (maxScore * 2)) * 100;
  
  // Round to nearest integer
  return Math.round(normalizedScore);
}

interface AssessmentQuestionsProps {
  surveyData: any;
  initialAnswers: AssessmentAnswer[];
  onSubmit: (answers: AssessmentAnswer[]) => void;
  onCancel?: () => void;
  guestUserId?: string;
  onScoreChange?: (score: number) => void;
}

interface Question {
  id: number;
  question: string;
  category: string;
}

export function AssessmentQuestions({
  surveyData,
  initialAnswers,
  onSubmit,
  onCancel,
  guestUserId,
  onScoreChange,
}: AssessmentQuestionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>(initialAnswers);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState<NodeJS.Timeout | null>(null);

  const LOCAL_STORAGE_KEY = guestUserId 
    ? `guest-assessment-${guestUserId}-${surveyData?.id}` 
    : null;

  // Use React Query to fetch questions
  const { data: questionData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/public/surveys/${surveyData?.id}/questions`],
    queryFn: async () => {
      const response = await fetch(`/api/public/surveys/${surveyData?.id}/questions`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
    enabled: !!surveyData?.id
  });
  
  // Load saved answers from localStorage on component mount
  useEffect(() => {
    if (LOCAL_STORAGE_KEY && questions.length > 0) {
      const savedAnswers = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
            setAnswers(parsedAnswers);
            // Find the last answered question
            let lastAnsweredIndex = parsedAnswers.length - 1;
            while (lastAnsweredIndex >= 0) {
              if (parsedAnswers[lastAnsweredIndex]?.a !== null) {
                break;
              }
              lastAnsweredIndex--;
            }
            // Set current question to the next unanswered one
            setCurrentQuestionIndex(Math.min(lastAnsweredIndex + 1, questions.length - 1));
          }
        } catch (e) {
          console.error("Error parsing saved assessment data:", e);
        }
      }
    }
  }, [LOCAL_STORAGE_KEY, questions]);
  
  // Process the data when it changes
  useEffect(() => {
    if (questionData?.success && questionData?.questions) {
      const parsedQuestions = questionData.questions
        .filter((q: any) => q.question && q.question.trim() !== "");
      
      setQuestions(parsedQuestions);
      
      // Initialize answers if needed
      if (answers.length === 0) {
        setAnswers(
          parsedQuestions.map((q: any) => ({
            q: q.id,
            a: null,
          }))
        );
      }
    }
  }, [questionData, answers.length]);
  
  // Update the isLoading state based on the query state
  useEffect(() => {
    setIsLoading(isQuestionsLoading);
  }, [isQuestionsLoading]);

  useEffect(() => {
    if (questions.length > 0) {
      setProgress(((currentQuestionIndex + 1) / questions.length) * 100);
    }
  }, [currentQuestionIndex, questions]);

  // Save answers to localStorage when they change
  useEffect(() => {
    if (LOCAL_STORAGE_KEY && answers.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers, LOCAL_STORAGE_KEY]);

  // Clear auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
    };
  }, [autoAdvanceTimeout]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit all answers
      onSubmit(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Save to localStorage
    if (LOCAL_STORAGE_KEY) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(answers));
      toast({
        title: "Progress saved",
        description: "Your assessment progress has been saved.",
      });
    }
    setIsSaving(false);
  };

  const handleAnswerChange = (answer: number | null) => {
    // Only proceed if user selected an answer (not null)
    if (answer !== null) {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = {
        ...updatedAnswers[currentQuestionIndex],
        a: answer as -2 | -1 | 0 | 1 | 2 | null,
      };
      setAnswers(updatedAnswers);
      
      // Calculate score immediately when answer is selected
      if (onScoreChange && typeof onScoreChange === 'function') {
        const calculatedScore = calculateScore(updatedAnswers);
        onScoreChange(calculatedScore);
      }
      
      // Save to localStorage only when an answer is selected
      if (LOCAL_STORAGE_KEY) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAnswers));
      }
      
      // Automatically proceed to next question after a delay
      if (currentQuestionIndex < questions.length - 1) {
        // Clear existing timeout if it exists
        if (autoAdvanceTimeout) {
          clearTimeout(autoAdvanceTimeout);
        }
        
        // Set new timeout
        const timeout = setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }, 500);
        
        setAutoAdvanceTimeout(timeout);
      }
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestionIndex]?.a || null;

  // Labels for answer options
  const answerLabels = {
    "-2": "Strongly Disagree",
    "-1": "Disagree",
    "0": "Neutral",
    "1": "Agree",
    "2": "Strongly Agree",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading questions...</span>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center">No questions found for this survey.</p>
          {onCancel && (
            <div className="flex justify-center mt-4">
              <Button onClick={onCancel}>Go Back</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <div>
            <CardTitle>{surveyData.title}</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-foreground font-medium">
            Completion Progress
          </span>
          <span className="text-sm font-medium text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {currentQuestion.category}
          </h2>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="text-lg">
            <div className="flex items-start">
              <span className="font-medium leading-tight">{currentQuestion.question}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 ml-1 -mt-0.5">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Question information</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Respond based on your organization's current situation, not aspirations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              What is your level of agreement with this statement?
            </div>
          </div>
        </div>

        <div className="py-4">
          <div className="flex flex-row items-center justify-between gap-2 mt-2">
            {Object.entries(answerLabels).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={currentAnswer?.toString() === value ? "default" : "outline"}
                className={`flex-1 text-xs sm:text-sm py-3 px-2 h-auto ${currentAnswer?.toString() === value ? 'shadow-sm' : ''}`}
                onClick={() => handleAnswerChange(parseInt(value))}
              >
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  // Clear localStorage before canceling
                  if (LOCAL_STORAGE_KEY) {
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                  }
                  onCancel();
                }}
              >
                Cancel
              </Button>
            )}
            
            {currentQuestionIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={currentAnswer === null || currentAnswer === undefined}
          >
            {isLastQuestion ? (
              <>
                Complete <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}