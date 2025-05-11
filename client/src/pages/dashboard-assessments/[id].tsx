import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { Assessment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Import survey helper functions
import { 
  parseCSV, 
  SurveyQuestion, 
  getQuestionTextById,
  setSurveyQuestionsCache
} from "@/lib/survey-data";

// Import our new components
import { LoadingScreen } from "@/components/assessments/loading-screen";
import { SurveyCompletion } from "@/components/assessments/survey-completion";
import { SurveyQuestionComponent } from "@/components/assessments/survey-question";
import { SurveyResponses } from "@/components/assessments/survey-responses";

export default function AssessmentDetailPage() {
  const [, params] = useRoute("/dashboard/assessments/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params?.id;

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; a?: number; r?: string }[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isCSVLoading, setIsCSVLoading] = useState(false);
  
  // Fetch assessment data
  const {
    data: assessment,
    error,
    isLoading: isAssessmentLoading,
  } = useQuery({
    queryKey: [`/api/assessments/${id}`],
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get survey template data after we have assessment
  const {
    data: surveyTemplate,
    isLoading: isSurveyLoading,
  } = useQuery({
    queryKey: [`/api/surveys/detail/${assessment?.assessment?.surveyTemplateId}`],
    enabled: !!assessment?.assessment?.surveyTemplateId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Handle CSV loading once we have the survey template
  useEffect(() => {
    if (surveyTemplate?.survey?.fileReference) {
      setIsCSVLoading(true);
      // Fetch and parse the CSV file
      fetch(`/api/csv-file/${surveyTemplate.survey.fileReference}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((csvText) => {
          const questions = parseCSV(csvText);
          setSurveyQuestions(questions);
          setSurveyQuestionsCache(questions);
          setIsCSVLoading(false);
        })
        .catch((error) => {
          console.error("Error loading CSV:", error);
          setIsCSVLoading(false);
          toast({
            title: "Error loading survey questions",
            description: "There was a problem loading the survey questions. Please try again later.",
            variant: "destructive",
          });
        });
    }
  }, [surveyTemplate?.survey?.fileReference, toast]);

  // Initialize answers from assessment data (or create empty ones if starting fresh)
  useEffect(() => {
    if (assessment?.assessment) {
      // Parse existing answers from the database
      try {
        const loadedAnswers = JSON.parse(assessment.assessment.answers);
        setAnswers(loadedAnswers);
        
        // Find the first unanswered question and set it as the current step
        if (assessment.assessment.status === 'in-progress') {
          const firstUnansweredIndex = loadedAnswers.findIndex(
            (a: { q: string; a?: number }) => a.a === undefined || a.a === null
          );
          
          if (firstUnansweredIndex !== -1) {
            setCurrentStep(firstUnansweredIndex);
          }
        }
      } catch (e) {
        console.error("Error parsing answers:", e);
        // If there's an error, create empty answers
        if (surveyQuestions.length > 0) {
          const newAnswers = surveyQuestions.map((q) => ({
            q: q.number.toString(),
            a: undefined,
          }));
          setAnswers(newAnswers);
        }
      }
    } else if (surveyQuestions.length > 0 && !assessment?.assessment?.answers) {
      // Create new empty answers if we have questions but no assessment answers
      const newAnswers = surveyQuestions.map((q) => ({
        q: q.number.toString(),
        a: undefined,
      }));
      setAnswers(newAnswers);
    }
  }, [assessment?.assessment, surveyQuestions]);

  // Save answers mutation
  const saveAnswersMutation = useMutation({
    mutationFn: async (data: typeof answers) => {
      return apiRequest("PATCH", `/api/assessments/${id}`, {
        answers: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assessments/${id}`] 
      });
      toast({
        title: "Progress saved",
        description: "Your assessment progress has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving progress",
        description: error.message || "There was a problem saving your progress.",
        variant: "destructive",
      });
    },
  });

  // Complete assessment mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      // Calculate score based on positive answers
      const total = answers.length;
      const answered = answers.filter((a) => a.a !== undefined && a.a !== null).length;
      const score = Math.round(
        (answers.reduce((sum, answer) => {
          const val = answer.a || 0;
          return sum + (val > 0 ? val : 0);
        }, 0) /
          (total * 2)) *
          100
      );

      return apiRequest("PATCH", `/api/assessments/${id}`, {
        status: "completed",
        score,
        answers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assessments/${id}`] 
      });
      setConfirmDialogOpen(false);
      toast({
        title: "Assessment completed",
        description: "Your assessment has been submitted successfully.",
      });
    },
    onError: (error) => {
      setConfirmDialogOpen(false);
      toast({
        title: "Error completing assessment",
        description: error.message || "There was a problem completing your assessment.",
        variant: "destructive",
      });
    },
  });

  // Update a specific answer
  const updateAnswer = (index: number, value: number) => {
    const newAnswers = [...answers];
    if (newAnswers[index]) {
      newAnswers[index].a = value;
      setAnswers(newAnswers);
    }
  };

  // Save current progress
  const saveProgress = () => {
    setIsSubmitting(true);
    saveAnswersMutation.mutate(answers, {
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Complete the assessment
  const completeAssessment = () => {
    setIsSubmitting(true);
    completeAssessmentMutation.mutate(undefined, {
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Download results as CSV
  const downloadResults = () => {
    if (!assessment?.assessment) return;

    // Create CSV content
    let csvContent = "Question,Answer,Score\n";
    
    answers.forEach((answer, index) => {
      const questionText = getQuestionTextById(answer.q);
      const answerText = 
        answer.a === 2 ? "Strongly Agree" :
        answer.a === 1 ? "Agree" :
        answer.a === 0 ? "Neutral" :
        answer.a === -1 ? "Disagree" :
        answer.a === -2 ? "Strongly Disagree" : "Not answered";
      
      csvContent += `"${questionText}","${answerText}",${answer.a || 0}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `assessment-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading state when all data isn't loaded yet
  const isLoading = isAssessmentLoading || isSurveyLoading || isCSVLoading;

  // If loading, show a loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/assessments")}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Skeleton className="h-8 w-56" />
          </div>
          <LoadingScreen />
        </div>
      </DashboardLayout>
    );
  }

  // If error or assessment not found, show an error message
  if (error || !assessment?.assessment) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/assessments")}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Assessment Not Found</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
              <p>Failed to load assessment. It may have been deleted or you don't have permission to view it.</p>
              <Button onClick={() => navigate("/dashboard/assessments")} className="mt-4">
                Return to Assessments
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { title, status, createdAt, score } = assessment.assessment;
  const maxScore = answers.length * 2; // Max score is 2 (strongly agree) per question
  const answeredCount = answers.filter((a) => a.a !== undefined && a.a !== null).length;
  const progress = (answeredCount / answers.length) * 100;

  // For completed assessments, show the completion view
  if (status === "completed") {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/assessments")}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-muted-foreground">
                Completed on {format(new Date(createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="results">
              <SurveyCompletion 
                assessment={assessment.assessment}
                score={score || 0}
                maxScore={maxScore}
                onDownloadResults={downloadResults}
              />
            </TabsContent>
            
            <TabsContent value="responses">
              <SurveyResponses answers={answers} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // For in-progress assessments, show the question form
  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-2"
          >
            <Link href="/dashboard/assessments">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">
                  Started on {format(new Date(createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              <Badge variant={status === "in-progress" ? "secondary" : "outline"}>
                {status === "in-progress" ? "In Progress" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Readiness Assessment</CardTitle>
            <CardDescription>
              Please indicate your level of agreement with each statement
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress: {Math.round(progress)}%</span>
                <span>{answeredCount} of {answers.length} questions</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <SurveyQuestionComponent
              currentStep={currentStep}
              totalSteps={answers.length}
              surveyQuestion={surveyQuestions[currentStep]}
              value={answers[currentStep]?.a || null}
              onChange={(value) => updateAnswer(currentStep, value)}
              onNext={() => setCurrentStep(Math.min(answers.length - 1, currentStep + 1))}
              onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
              isSubmitting={isSubmitting}
            />
          </CardContent>

          <div className="p-6 pt-0 flex flex-wrap justify-between gap-2 border-t mt-6">
            <Button
              variant="outline"
              onClick={saveProgress}
              disabled={isSubmitting}
            >
              {saveAnswersMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </>
              )}
            </Button>

            <Button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={
                isSubmitting ||
                answeredCount < answers.length // All questions must be answered
              }
            >
              {completeAssessmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog 
          open={confirmDialogOpen} 
          onOpenChange={setConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Assessment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to complete this assessment? You won't be able to change your answers after completion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={completeAssessment}>
                Complete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}