import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [stage, setStage] = useState<AssessmentStage>(AssessmentStage.INFO_COLLECTION);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<any | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  const { toast } = useToast();

  // Default survey template ID (survey 17 for now)
  const defaultSurveyId = 17;

  // Load survey data
  useEffect(() => {
    if (stage === AssessmentStage.SURVEY_QUESTIONS && !surveyData) {
      fetchSurveyData();
    }
  }, [stage]);

  const fetchSurveyData = async () => {
    setIsLoading(true);
    try {
      // Use the public endpoint that doesn't require authentication
      const response = await fetch(`/api/public/surveys/detail/${defaultSurveyId}`);
      const data = await response.json();
      
      if (data.success && data.survey) {
        setSurveyData(data.survey);
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
      
      // Create assessment result data
      const assessmentResult = {
        title: `${guestUser?.name}'s AI Readiness Assessment`,
        email: guestUser?.email,
        name: guestUser?.name,
        company: guestUser?.company,
        surveyTemplateId: defaultSurveyId,
        answers: answers,
        status: "completed",
        score
      };
      
      // Set assessment result to be used in the completion stage
      setAssessmentResult(assessmentResult);
      
      // Move to completed stage
      setStage(AssessmentStage.COMPLETED);
      
      // Here you would normally submit to an API endpoint
      // But for now, just store in localStorage
      localStorage.setItem("guestAssessment", JSON.stringify(assessmentResult));
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
  const calculateScore = (answers: AssessmentAnswer[]): number => {
    // Simple scoring algorithm
    const validAnswers = answers.filter(a => a.a !== undefined && a.a !== null);
    if (validAnswers.length === 0) return 0;
    
    const total = validAnswers.reduce((sum, answer) => {
      return sum + (answer.a || 0);
    }, 0);
    
    // Convert to 0-100 scale (normalize from -2 to 2 range)
    const normalized = ((total / (validAnswers.length * 2)) + 1) * 50;
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
                Complete this quick survey to evaluate your organization's AI readiness
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
                initialAnswers={[]}
                onSubmit={handleQuestionsSubmit}
                onCancel={() => setStage(AssessmentStage.INFO_COLLECTION)}
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
              survey={surveyData}
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

  return (
    <div className="w-full pt-4">
      {renderContent()}
    </div>
  );
}