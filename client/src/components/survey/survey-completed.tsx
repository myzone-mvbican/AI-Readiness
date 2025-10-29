import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Loader2,
  InfoIcon,
  GitCompare,
  FileBarChart2,
  ListTodo,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvQuestion, Survey, Assessment } from "@shared/types";
import { formatDate } from "@/lib/utils";
import { ToastAction } from "@/components/ui/toast";
import { navigate } from "wouter/use-browser-location";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Screens
import ScreenResults from "./screens/results";
import ScreenAnswers from "./screens/answers";
import ScreenCompare from "./screens/compare";
import ScreenRecommendations from "./screens/recommendations";

interface SurveyCompletedProps {
  assessment: Assessment & { survey?: Survey };
  questions: CsvQuestion[];
  additionalActions?: React.ReactNode;
}

export default function SurveyCompleted({
  assessment,
  questions,
  additionalActions,
}: SurveyCompletedProps) {
  // Check if user is authenticated
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !!user;
  // State for PDF generation and tracking recommendations request
  const [isLoading, setIsLoading] = useState(false);
  // Access query client for mutations
  const queryClient = useQueryClient();

  // Define payload type for the mutation
  type RecommendationPayload = {
    recommendations: string;
  };

  // Mutation for saving recommendations to the assessment
  const saveRecommendationsMutation = useMutation<
    { success: boolean; data?: { assessment: any } },
    Error,
    RecommendationPayload
  >({
    mutationFn: async (data) => {
      const endpoint = isAuthenticated
        ? `/api/assessments/${assessment.id}`
        : `/api/public/assessments/${assessment.id}`;

      const payload = { recommendations: data.recommendations };

      const response = await apiRequest("PATCH", endpoint, payload);

      return response.json();
    },
    onSuccess: () => {
      // Invalidate appropriate queries to refresh data
      if (isAuthenticated) {
        queryClient.invalidateQueries({
          queryKey: [`/api/assessments/${assessment.id}`],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: [`/api/public/assessments/${assessment.id}`],
        });
      }

      // Show success toast
      toast({
        title: "Success",
        description: "Recommendations updated successfully",
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to update recommendations: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Effect to handle recommendations
  useEffect(() => {
    // Only fetch recommendations if not already present
    // and if questions are available
    // and if not loading
    if (isLoading || assessment?.recommendations) {
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);

        // First, fetch the complete assessment data from the server
        const assessmentEndpoint = isAuthenticated
          ? `/api/assessments/${assessment.id}`
          : `/api/public/assessments/${assessment.id}`;
        
        const assessmentResponse = await apiRequest("GET", assessmentEndpoint);
        const assessmentData = await assessmentResponse.json();
        
        if (!assessmentData.success) {
          throw new Error("Failed to fetch assessment data");
        }

        // Use the complete assessment data from the server
        const completeAssessment = assessmentData.data.assessment;

        // Now send the complete assessment to AI suggestions
        const response = await apiRequest("POST", "/api/ai-suggestions", {
          assessment: completeAssessment,
        });

        const result = await response.json();
        if (!result.success || !result.data?.recommendations) {
          throw new Error("Failed to generate recommendations");
        }

        // Create payload for saving recommendations
        const payload: RecommendationPayload = {
          recommendations: result.data.recommendations,
        };

        // Save recommendations
        await saveRecommendationsMutation.mutateAsync(payload);

        // Manually update assessment in local memory to prevent refetch
        if (assessment && result.data.recommendations) {
          assessment.recommendations = result.data.recommendations;
          
          // Update PDF path if PDF was generated
          if (result.data.pdfGenerated && result.data.pdfPath) {
            assessment.pdfPath = result.data.pdfPath;
          }
        }

        // Show success message with PDF generation status
        const pdfMessage = result.data.pdfGenerated
          ? "Recommendations generated and PDF saved automatically."
          : "Recommendations generated.";

        toast({
          title: "Ready",
          description: pdfMessage,
          action: isAuthenticated ? (
            <ToastAction
              altText="View Recommendations"
              onClick={() => {
                navigate(`/dashboard/assessments/${assessment.id}`);
              }}
            >
              View
            </ToastAction>
          ) : undefined,
        });

        // Log PDF generation info for debugging
        if (result.data.pdfGenerated) {
          console.log("PDF automatically generated and saved:", result.data.pdfPath);
        }
      } catch (error) {
        console.error("Recommendations error:", error);
        toast({
          title: "Error",
          description: "Failed to generate recommendations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [assessment, isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 space-y-6 md:space-y-0 py-4">
        <div className="col-span-1 self-end flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-start">
            <h2 className="text-xl md:text-2xl text-foreground font-bold">
              Assessment Completed
            </h2>
            <p className="text-sm md:text-normal text-muted-foreground mt-2">
              You scored {(assessment.score ?? 0) / 10} out of 10 on this AI
              readiness assessment.
            </p>
            <p className="text-sm md:text-normal text-muted-foreground">
              Completed on:{" "}
              {formatDate(assessment.completedOn?.toString() || new Date())}
            </p>
          </div>
        </div>
        <div className="col-span-1 self-center sm:flex sm:justify-end">
          <div className="flex flex-col gap-4">
            {additionalActions}
            {assessment?.recommendations === null ? (
              <Tooltip defaultOpen>
                <TooltipTrigger asChild>
                  <Button disabled variant="secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing PDF...
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-2 max-w-xs">
                  <p>
                    Don't reload the page - Our AI Agent is crafting a beautiful
                    PDF for you.
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <a
                className="flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                style={{ textDecoration: "none" }}
                download="download"
                href={assessment.pdfPath || "#"}
              >
                <>
                  <Download className="size-4" />
                  {!assessment.pdfPath ? "Preparing PDF..." : "Download PDF"}
                </>
              </a>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="results" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="results">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <GitCompare className="size-4" />
                  <span className="text-[8px] md:text-sm">Results</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                View the overall assessment results.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="responses">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <ListTodo className="size-4" />
                  <span className="text-[8px] md:text-sm">Responses</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                See all your responses from the assessment.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <InfoIcon className="size-4" />
                  <span className="text-[8px] md:text-sm">Recommendations</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Review AI-generated improvement suggestions.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <FileBarChart2 className="size-4" />
                  <span className="text-[8px] md:text-sm">Compare</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Compare your assessment with others.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <ScreenResults assessment={assessment} />
        </TabsContent>

        <TabsContent value="responses">
          <ScreenAnswers assessment={assessment} questions={questions} />
        </TabsContent>

        <TabsContent value="suggestions">
          <ScreenRecommendations
            assessment={assessment}
            isLoading={isLoading || saveRecommendationsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="compare">
          <ScreenCompare assessment={assessment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
