import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AssessmentAnswer,
  AssessmentResponse,
  CsvQuestion,
  Survey,
} from "@shared/types";

import SurveyError from "./error";
import SurveyLoading from "./loading";
import SurveyCompleted from "@/components/survey/survey-completed";
import SurveyTemplate from "@/components/survey/survey-template";

const validatedAnswers = ({
  questions,
  answers,
}: {
  questions: Array<CsvQuestion>;
  answers: Array<AssessmentAnswer>;
}) =>
  answers.map((answer, index) => {
    // Make sure q field is always properly set and is a number
    if (answer.q === null || answer.q === undefined) {
      // If q is missing, get it from the survey questions
      const questionNumber = questions[index]?.id || index + 1;
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

const AdditionalActions = () => {
  const [, navigate] = useLocation();

  return (
    <Button
      variant="outline"
      onClick={() => {
        navigate("/dashboard/assessments");
      }}
    >
      Return to Assessments
    </Button>
  );
};

export default function AssessmentDetailPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/dashboard/assessments/:id");
  const [, navigate] = useLocation();
  const assessmentId = params?.id ? parseInt(params.id) : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Array<CsvQuestion>>([]);
  const [answers, setAnswers] = useState<Array<AssessmentAnswer>>([]);

  // const datas = async () => {
  //   return await apiRequest("POST", "/api/admin/benchmark/recalculate");
  // };

  // datas();

  // Fetch assessment data
  const { data, isLoading, error } = useQuery<{
    success: boolean;
    data?: { assessment: AssessmentResponse["assessment"] & { survey: Survey } };
  }>({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const assessment = data?.data?.assessment;

  // Is assessment completed?
  const isCompleted = assessment?.status === "completed";

  // Set questions/answers from fetched data
  useEffect(() => {
    if (assessment) {
      // Load any existing saved answers from the assessment
      if (assessment.answers && assessment.answers.length > 0) {
        // Make sure to set the state
        setAnswers(assessment.answers);
      }

      // Get survey template information
      if (assessment.survey && assessment.survey.questions.length > 0) {
        setQuestions(assessment.survey.questions);
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
    if (isLoading || isCompleted) {
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
  }, [answers, isLoading, isCompleted]);

  // Update assessment mutation
  const updateAssessmentMutation = useMutation<
    { success: boolean; data?: { assessment: AssessmentResponse["assessment"] } },
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
      } else {
        // Just saving progress
        toast({
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          title: "Progress saved",
          description: "Your progress has been saved.",
        });
      }
      // Invalidate the current assessment query to ensure latest data
      queryClient.invalidateQueries({
        queryKey: [`/api/assessments/${assessmentId}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/assessments"],
      });
      // Invalidate completion status when assessment is completed
      if (variables.status === "completed") {
        queryClient.invalidateQueries({
          queryKey: ["/api/surveys/completion-status"],
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
    },
  });

  // Handle saving progress
  const handleSave = () => {
    setIsSubmitting(true);

    updateAssessmentMutation.mutate({
      status: "in-progress",
      answers: validatedAnswers({ questions, answers }),
    });
  };

  // Handle canceling the assessment
  const handleCancel = () => {
    navigate("/dashboard/assessments");
  };

  // Confirm assessment completion
  const confirmComplete = () => {
    setIsSubmitting(true);

    updateAssessmentMutation.mutate({
      status: "completed",
      answers: validatedAnswers({ questions, answers }),
    });
  };

  // Handle updating an answer, ensuring proper handling of zero value
  // and automatically advancing to the next question
  const updateAnswer = (index: number, value: number) => {
    const newAnswers = [...answers];

    // Always ensure we have a proper question number
    const questionNumber = questions[index]?.id || index + 1;

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

  // Handle bulk answer updates (for random completion)
  const updateBulkAnswers = (newAnswers: AssessmentAnswer[]) => {
    setAnswers(newAnswers);
  };

  if (isLoading) {
    return <SurveyLoading />;
  }

  if (error || !assessment) {
    return <SurveyError />;
  }

  return (
    <DashboardLayout title={assessment.title}>
      {/* Use our reusable SurveyTemplate component instead of repeating the UI */}
      {isCompleted ? (
        <SurveyCompleted
          assessment={assessment}
          questions={questions}
          additionalActions={<AdditionalActions />}
        />
      ) : (
        <SurveyTemplate
          assessment={assessment}
          questions={questions}
          answers={answers}
          onAnswerChange={updateAnswer}
          onBulkAnswerChange={updateBulkAnswers}
          isSubmitting={isSubmitting}
          showSaveButton={true}
          onCancel={handleCancel}
          onSave={handleSave}
          onComplete={confirmComplete}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
      )}
    </DashboardLayout>
  );
}
