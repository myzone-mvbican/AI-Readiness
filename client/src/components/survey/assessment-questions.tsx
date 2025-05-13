import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { AssessmentAnswer } from "@shared/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface AssessmentQuestionsProps {
  surveyData: any;
  initialAnswers: AssessmentAnswer[];
  onSubmit: (answers: AssessmentAnswer[]) => void;
  onCancel?: () => void;
  guestUserId?: string;
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
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      a: answer as -2 | -1 | 0 | 1 | 2 | null,
    };
    setAnswers(updatedAnswers);
    
    // Automatically proceed to next question after a delay
    if (answer !== null && currentQuestionIndex < questions.length - 1) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
          <h2 className="text-xl font-bold text-foreground text-center md:text-start">
            {currentQuestion.category}
          </h2>
        </div>
        
        <div className="text-lg font-medium">{currentQuestion.question}</div>

        <div className="py-2">
          <RadioGroup
            value={currentAnswer !== null ? currentAnswer.toString() : undefined}
            onValueChange={(value) => handleAnswerChange(value ? parseInt(value) : null)}
            className="flex flex-col space-y-2"
          >
            {Object.entries(answerLabels).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={value} id={`answer-${value}`} />
                <Label
                  htmlFor={`answer-${value}`}
                  className="cursor-pointer flex-grow py-1"
                >
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
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
            
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Progress
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            
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
        </div>
      </CardContent>
    </Card>
  );
}