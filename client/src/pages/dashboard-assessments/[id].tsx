import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
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
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Assessment } from "@shared/schema";
import { format } from "date-fns";

import SurveyError from "./survey-error";
import SurveyLoading from "./survey-loading";
import SurveyQuestion from "./survey-question";
import SurveyCompleted from "./survey-completed";
import AlertCompleted from "./alert-completed";

interface AssessmentResponse {
  success: boolean;
  assessment: Assessment & { survey: { title: string } };
}

interface UpdateAssessmentResponse {
  success: boolean;
  assessment: Assessment;
}

export default function AssessmentDetailPage() {
  const [, params] = useRoute("/dashboard/assessments/:id");
  const [, navigate] = useLocation();
  const assessmentId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const [surveyQuestions, setSurveyQuestions] = useState<
    Array<{
      number: number;
      text: string;
      description: string;
      category: string;
    }>
  >([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [answers, setAnswers] = useState<
    Array<{ q: string; a: number | null; r?: string }>
  >([]);

  // Load survey questions from CSV file reference
  const loadSurveyQuestions = async (fileReference: string) => {
    try {
      setIsLoadingQuestions(true);

      // Validate the file reference
      if (!fileReference) {
        toast({
          title: "Error",
          description: "Invalid file reference provided",
          variant: "destructive",
        });
        throw new Error("Invalid file reference provided");
      }

      // Extract the filename from the file reference path
      // The file reference might be a full path like "/home/runner/workspace/uploads/survey-123.csv"
      // or just the filename like "survey-123.csv"
      let filename = fileReference;

      // If it's a path, extract just the filename
      if (fileReference.includes("/")) {
        filename = fileReference.split("/").pop() || "";
      }

      // Use our dedicated CSV serving endpoint, ensuring we have proper error handling
      const csvEndpoint = `/api/csv-file/${filename}`;

      const response = await fetch(csvEndpoint);

      if (!response.ok) {
        toast({
          title: "Error",
          description: `Failed to load survey file: ${response.statusText}`,
          variant: "destructive",
        });
        throw new Error(`Failed to load survey file: ${response.statusText}`);
      }

      const csvData = await response.text();

      // Validate CSV data - show the first few characters to debug
      if (csvData.length === 0) {
        toast({
          title: "Error",
          description: "Empty survey file",
          variant: "destructive",
        });
        throw new Error("Empty survey file");
      }

      // Parse CSV with PapaParse
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings
        transform: (value) => value?.trim(), // Trim whitespace
        complete: (results) => {
          // Map the parsed data to our format
          const questions = results.data
            .map((row: any, index: number) => {
              // Check if the row has the expected properties
              if (!row["Question Number"]) {
                return null;
              }

              const questionNumber = parseInt(row["Question Number"], 10);
              if (isNaN(questionNumber)) {
                return null;
              }

              const question = {
                number: questionNumber,
                category: row["Category"] ? row["Category"].trim() : "",
                text: row["Question Summary"]
                  ? row["Question Summary"].trim()
                  : "",
                description: row["Question Details"]
                  ? row["Question Details"].trim()
                  : "",
              };

              return question;
            })
            .filter(
              (
                q: any,
              ): q is {
                text: string;
                description: string;
                category: string;
                number: number;
              } => q !== null,
            )
            .sort((a, b) => a.number - b.number);

          // Set the survey questions
          setSurveyQuestions(questions);

          // If we have an answers array that doesn't match the questions length,
          // initialize it with the correct number of questions
          if (answers.length === 0 && questions.length > 0) {
            const initialAnswers = questions.map((q, index) => ({
              q: q.number.toString(), // Store question number/ID instead of full text
              a: null,
            }));
            setAnswers(initialAnswers);
          }

          setIsLoadingQuestions(false);
        },
        error: () => {
          toast({
            title: "Error loading survey questions",
            description: "Failed to parse the survey template file.",
            variant: "destructive",
          });
          setIsLoadingQuestions(false);
        },
      });
    } catch (error) {
      toast({
        title: "Error loading survey",
        description: "Failed to load the survey template file.",
        variant: "destructive",
      });
      setIsLoadingQuestions(false);
    }
  };

  // Fetch assessment data
  const { data, isLoading, error } = useQuery<AssessmentResponse>({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const assessment = data?.assessment;

  // Combined loading state for all async operations
  const isFullyLoading = isLoading || isLoadingQuestions;

  // Set answers from fetched data
  useEffect(() => {
    if (assessment) {
      // Load any existing saved answers from the assessment
      if (assessment.answers && assessment.answers.length > 0) {
        setAnswers(assessment.answers);
      }
      
      // Get survey template information
      if (assessment.surveyTemplateId) {
        // Fetch the survey template details if not already provided
        if (!assessment.survey || !assessment.survey.fileReference) {
          // Get API URL
          const apiUrl = `/api/surveys/detail/${assessment.surveyTemplateId}`;

          // Try to load from the correct API endpoint
          fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              return response.json();
            })
            .then((data) => {
              if (data.success && data.survey) {
                if (data.survey.fileReference) {
                  loadSurveyQuestions(data.survey.fileReference);
                } else {
                  toast({
                    title: "Survey Error",
                    description:
                      "The survey template doesn't have a valid file reference.",
                    variant: "destructive",
                  });
                }
              } else {
                toast({
                  title: "Survey Error",
                  description: "Failed to fetch the survey template.",
                  variant: "destructive",
                });
              }
            })
            .catch((error) => {
              toast({
                title: "Survey Error",
                description:
                  "An error occurred while fetching the survey template.",
                variant: "destructive",
              });
            });
        } else {
          loadSurveyQuestions(assessment.survey.fileReference);
        }
      } else {
        toast({
          title: "Assessment Error",
          description: "This assessment doesn't have a valid survey template.",
          variant: "destructive",
        });
      }
    }
  }, [assessment]);

  // Find first unanswered question and navigate to it
  useEffect(() => {
    // Only proceed when loading is complete
    if (isFullyLoading) {
      return;
    }

    if (answers.length > 0 && assessment && assessment.status !== "completed") {
      // Find the first unanswered question
      const firstUnansweredIndex = answers.findIndex((a) => a.a === null);

      if (firstUnansweredIndex !== -1) {
        // If there's an unanswered question, go to it
        setCurrentStep(firstUnansweredIndex);
      }
    }
  }, [answers, assessment, isFullyLoading]);

  // Update assessment mutation
  const updateAssessmentMutation = useMutation<
    UpdateAssessmentResponse,
    Error,
    { status?: string; answers: typeof answers }
  >({
    mutationFn: async (updateData) => {
      const response = await apiRequest(
        "PATCH",
        `/api/assessments/${assessmentId}`,
        updateData,
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      // If completing the assessment, navigate to results view
      if (variables.status === "completed") {
        toast({
          title: "Assessment completed",
          description:
            "Your AI readiness assessment has been completed successfully.",
        });

        // Invalidate queries
        queryClient.invalidateQueries({
          queryKey: [`/api/assessments/${assessmentId}`],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/assessments"],
        });

        navigate(`/dashboard/assessments`);
      } else {
        // Just saving progress
        toast({
          title: "Progress saved",
          description: "Your progress has been saved.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating assessment",
        description:
          error.message || "Failed to update assessment. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
      setCompleteDialogOpen(false);
    },
  });

  // Handle saving progress
  const handleSave = () => {
    setIsSubmitting(true);
    updateAssessmentMutation.mutate({
      status: "in-progress",
      answers,
    });
  };

  // Handle completing assessment
  const handleComplete = () => {
    // Use our improved allQuestionsAnswered function to check completion status
    if (!allQuestionsAnswered()) {
      toast({
        title: "Unable to complete",
        description:
          "Please answer all questions before completing the assessment.",
        variant: "destructive",
      });
      return;
    }

    setCompleteDialogOpen(true);
  };

  // Confirm assessment completion
  const confirmComplete = () => {
    setIsSubmitting(true);
    updateAssessmentMutation.mutate({
      status: "completed",
      answers,
    });
  };

  // Handle updating an answer, ensuring proper handling of zero value
  // and automatically advancing to the next question
  const updateAnswer = (index: number, value: number) => {
    const newAnswers = [...answers];

    if (newAnswers[index]) {
      // Update existing answer
      newAnswers[index] = {
        ...newAnswers[index],
        a: value, // value can be -2, -1, 0, 1, or 2
      };
    } else {
      // Create new answer if it doesn't exist
      const questionNumber = surveyQuestions[index]?.number || index + 1;
      newAnswers[index] = {
        q: questionNumber.toString(), // Store question number/ID instead of full text
        a: value,
      };
    }

    setAnswers(newAnswers);
    
    // Automatically advance to next question if not on the last question
    if (index < answers.length - 1) {
      setCurrentStep(index + 1);
    }
  };

  // Calculate progress percentage based on the number of survey questions
  const calculateProgress = () => {
    if (!surveyQuestions.length) return 0;
    if (!answers.length) return 0;

    // Count how many questions have been answered with a valid value (including 0 for neutral)
    const answeredCount = answers.filter(
      (a) => a.a !== null && a.a !== undefined,
    ).length;

    // Calculate percentage based on the total number of survey questions
    return Math.round((answeredCount / surveyQuestions.length) * 100);
  };

  // Check if all questions are answered (for Complete button)
  const allQuestionsAnswered = () => {
    // If we don't have survey questions or answers, return false
    if (!surveyQuestions.length || !answers.length) return false;

    // Check if we have the same number of answers as questions
    if (answers.length < surveyQuestions.length) {
      return false;
    }

    // Check if all answers have a value that is not null or undefined
    // This will properly handle 0 as a valid answer (neutral)
    for (let i = 0; i < surveyQuestions.length; i++) {
      // Using strict comparison to check for null/undefined
      // Note that 0 as a value will pass this check (which is what we want)
      if (answers[i]?.a === null || answers[i]?.a === undefined) {
        return false;
      }
    }

    return true;
  };

  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Is assessment completed?
  const isCompleted = assessment?.status === "completed";

  // Get status badge
  const getStatusBadge = () => {
    const status = assessment?.status || "";

    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Draft
          </Badge>
        );
    }
  };

  if (isFullyLoading) {
    return <SurveyLoading />;
  }

  if (error || !assessment) {
    return <SurveyError />;
  }

  if (isCompleted) {
    return (
      <SurveyCompleted
        assessment={assessment}
        surveyQuestions={surveyQuestions}
      />
    );
  }

  return (
    <DashboardLayout title={assessment.title}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <h2 className="text-2xl font-medium dark:text-white">
              {assessment.title}
            </h2>
            <p className="mt-2 mb-0 text-muted-foreground">
              Based on: {assessment.survey.title}
            </p>
          </div>
          <div className="col-span-1 md:text-end">
            {getStatusBadge()}
            <p className="text-muted-foreground mt-2">
              <span className="text-sm text-muted-foreground">
                Last Updated: {getFormattedDate(assessment.updatedAt)}
              </span>
            </p>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-foreground font-medium">
              Completion Progress
            </span>
            <span className="text-sm font-medium text-foreground">
              {calculateProgress()}%
            </span>
          </div>
          <Progress
            value={calculateProgress()}
            className="h-2 text-foreground"
          />
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">
              Assessment Questions
            </h2>
            <div className="flex items-center gap-2">
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
                {currentStep + 1} of {answers.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentStep(Math.min(answers.length - 1, currentStep + 1))
                }
                disabled={currentStep === answers.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          <Card className="border-2 border-muted">
            <CardHeader className="bg-muted">
              <CardTitle className="flex items-center space-x-3">
                <h3 className="text-lg font-bold">
                  Question {currentStep + 1} of {surveyQuestions.length}
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle2 className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2">
                    {surveyQuestions[currentStep]?.description}
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {/* Display the question text with description from CSV */}
                <p className="text-lg">
                  {surveyQuestions[currentStep]?.text ||
                    `Question ${currentStep + 1}`}
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <SurveyQuestion
                question="What is your level of agreement with this statement?"
                value={answers[currentStep]?.a || null}
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
                  setCurrentStep(Math.min(answers.length - 1, currentStep + 1))
                }
                disabled={currentStep === answers.length - 1}
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
                Your answers are saved when you click "Save Progress". To
                finalize your assessment, answer all questions and click
                "Complete Assessment". Completed assessments cannot be modified.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-t py-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/assessments")}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Progress
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button
                    onClick={handleComplete}
                    disabled={isSubmitting || !allQuestionsAnswered()}
                    className={!allQuestionsAnswered() ? "opacity-50" : ""}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Assessment
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                {!allQuestionsAnswered()
                  ? "Please answer all questions to complete the assessment"
                  : "Complete assessment and view results"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Completing Assessment */}
      <AlertCompleted
        completeDialogOpen={completeDialogOpen}
        setCompleteDialogOpen={setCompleteDialogOpen}
        isSubmitting={isSubmitting}
        confirmComplete={confirmComplete}
      />
    </DashboardLayout>
  );
}
