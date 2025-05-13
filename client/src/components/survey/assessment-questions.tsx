import { useState, useEffect } from "react";
import { parse } from "papaparse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AssessmentAnswer } from "@shared/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface AssessmentQuestionsProps {
  surveyData: any;
  initialAnswers: AssessmentAnswer[];
  onSubmit: (answers: AssessmentAnswer[]) => void;
  onCancel?: () => void;
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
}: AssessmentQuestionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>(initialAnswers);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (surveyData && surveyData.id) {
      fetchQuestions(surveyData.id);
    }
  }, [surveyData]);

  const fetchQuestions = async (surveyId: number) => {
    setIsLoading(true);
    try {
      // Use the new API endpoint to get parsed questions
      const response = await fetch(`/api/public/surveys/${surveyId}/questions`);
      const data = await response.json();
      
      if (data.success && data.questions) {
        const parsedQuestions = data.questions
          .filter((q: any) => q.question && q.question.trim() !== "");
        
        setQuestions(parsedQuestions);
        
        // Initialize answers if needed
        if (answers.length === 0) {
          setAnswers(
            parsedQuestions.map((q: any) => ({
              q: q.id,
              a: null,
              r: "",
            }))
          );
        }
      } else {
        console.error("Failed to fetch questions:", data.message);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length > 0) {
      setProgress(((currentQuestionIndex + 1) / questions.length) * 100);
    }
  }, [currentQuestionIndex, questions]);

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

  const handleAnswerChange = (answer: number | null) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      a: answer as -2 | -1 | 0 | 1 | 2 | null,
    };
    setAnswers(updatedAnswers);
  };

  const handleRecommendationChange = (recommendation: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      r: recommendation,
    };
    setAnswers(updatedAnswers);
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestionIndex]?.a;
  const currentRecommendation = answers[currentQuestionIndex]?.r || "";

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
          <div className="text-sm text-muted-foreground">
            Category: {currentQuestion.category}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentQuestion.question}</div>

        <div className="py-2">
          <RadioGroup
            value={currentAnswer !== null ? currentAnswer.toString() : undefined}
            onValueChange={(value) => handleAnswerChange(value ? parseInt(value) : null)}
            className="flex flex-col space-y-2"
          >
            {Object.entries(answerLabels).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`answer-${value}`} />
                <Label
                  htmlFor={`answer-${value}`}
                  className="cursor-pointer flex-grow py-2"
                >
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="recommendation">
            Additional comments or recommendations (optional)
          </Label>
          <Textarea
            id="recommendation"
            value={currentRecommendation}
            onChange={(e) => handleRecommendationChange(e.target.value)}
            className="mt-1"
            placeholder="Add any comments or recommendations..."
          />
        </div>

        <div className="flex justify-between pt-4">
          <div>
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