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
  InfoIcon,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Assessment } from "@shared/types";
import { format } from "date-fns";

import SurveyError from "./error";
import SurveyLoading from "./loading";
import SurveyQuestion from "@/components/survey/survey-question";
import SurveyCompleted from "@/components/survey/survey-completed";
import AlertCompleted from "@/components/survey/alert-completed";
import SurveyTemplate from "@/components/survey/survey-template";

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
    Array<{ q: number; a: number | null | undefined; r?: string }>
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

  // Is assessment completed?
  const isCompleted = assessment?.status === "completed";
  // Combined loading state for all async operations
  const isFullyLoading = isLoading || isLoadingQuestions;

  // Set answers from fetched data
  useEffect(() => {
    if (assessment) {
      // Load any existing saved answers from the assessment
      if (assessment.answers && assessment.answers.length > 0) {
        // Convert any string question IDs to numbers and ensure proper structure
        const fixedAnswers = assessment.answers.map(({ q, a }) => {
          return { q, a };
        });

        // Make sure to set the state
        setAnswers(fixedAnswers);
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
    if (isFullyLoading || isCompleted) {
      return;
    }

    if (answers.length > 0) {
      // Find the first unanswered question
      // Make sure to handle null, undefined and use strict equality for better zero handling
      const firstUnansweredIndex = answers.findIndex(
        (a) => a.a === null || a.a === undefined,
      );

      if (firstUnansweredIndex !== -1) {
        // If there's an unanswered question, go to it
        setTimeout(() => setCurrentStep(firstUnansweredIndex), 500);
      }
    }
  }, [answers, isFullyLoading, isCompleted]);

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
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
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

        // navigate(`/dashboard/assessments`);
      } else {
        // Just saving progress
        toast({
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          title: "Progress saved",
          description: "Your progress has been saved.",
        });

        // Invalidate the current assessment query to ensure latest data
        queryClient.invalidateQueries({
          queryKey: [`/api/assessments/${assessmentId}`],
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

    // Ensure all answers have proper question numbers
    const validatedAnswers = answers.map((answer, index) => {
      // Make sure q field is always properly set and is a number
      if (answer.q === null || answer.q === undefined) {
        // If q is missing, get it from the survey questions
        const questionNumber = surveyQuestions[index]?.number || index + 1;
        return {
          ...answer,
          q: Number(questionNumber),
        };
      }

      return {
        ...answer,
        q: typeof answer.q === "string" ? Number(answer.q) : answer.q,
      };
    });

    updateAssessmentMutation.mutate({
      status: "in-progress",
      answers: validatedAnswers,
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

    // Ensure all answers have proper question numbers before completing
    const validatedAnswers = answers.map((answer, index) => {
      // Make sure q field is always properly set and is a number
      if (answer.q === null || answer.q === undefined) {
        // If q is missing, get it from the survey questions
        const questionNumber = surveyQuestions[index]?.number || index + 1;
        return {
          ...answer,
          q: Number(questionNumber),
        };
      }
      return {
        ...answer,
        q: typeof answer.q === "string" ? Number(answer.q) : answer.q,
      };
    });

    updateAssessmentMutation.mutate({
      status: "completed",
      answers: validatedAnswers,
    });
  };

  // Handle updating an answer, ensuring proper handling of zero value
  // and automatically advancing to the next question
  const updateAnswer = (index: number, value: number) => {
    const newAnswers = [...answers];

    // Always ensure we have a proper question number
    const questionNumber = surveyQuestions[index]?.number || index + 1;

    if (newAnswers[index]) {
      // Update existing answer
      newAnswers[index] = {
        ...newAnswers[index],
        q: Number(questionNumber), // Always ensure q is set as a number
        a: value, // value can be -2, -1, 0, 1, or 2
      };
    } else {
      // Create new answer if it doesn't exist
      newAnswers[index] = {
        q: Number(questionNumber), // Ensure the question ID is a number, not a string
        a: value,
      };
    }

    setAnswers(newAnswers);
  };

  // Calculate progress percentage based on the number of survey questions
  const calculateProgress = () => {
    if (!surveyQuestions.length || !answers.length) {
      return 0;
    }

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
    if (!surveyQuestions.length || !answers.length) {
      return false;
    }

    // Check if we have the same number of answers as questions
    if (answers.length < surveyQuestions.length) {
      return false;
    }

    // Check if all answers have a value that is not null or undefined or empty string
    // This will properly handle 0 as a valid answer (neutral)
    for (let i = 0; i < surveyQuestions.length; i++) {
      const answerValue = answers[i]?.a;
      // Using strict comparison to check for null/undefined/""
      // Note that 0 as a value will pass this check (which is what we want)
      if (answerValue === null || answerValue === undefined) {
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

  const currentProgress = calculateProgress();

  return (
    <DashboardLayout title={assessment.title}>
      {/* Use our reusable SurveyTemplate component instead of repeating the UI */}
      <SurveyTemplate
        assessment={assessment}
        questions={surveyQuestions}
        answers={answers}
        onAnswerChange={updateAnswer}
        isSubmitting={isSubmitting}
        showSaveButton={true}
        onCancel={() => navigate("/dashboard/assessments")}
        onSave={handleSave}
        onComplete={() => setCompleteDialogOpen(true)}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      
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
