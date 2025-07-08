import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastAction } from "@/components/ui/toast";
import { navigate } from "wouter/use-browser-location";
import { Survey, Assessment } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateAndSavePDF } from "@/lib/pdf-utils";

interface ScreenRecommendations {
  assessment: Assessment & { survey?: Survey };
}

export default function ScreenRecommendations({
  assessment,
}: ScreenRecommendations) {
  const { toast } = useToast();
  const {
    survey: { questions = [] },
  } = assessment;

  // State for PDF generation and tracking recommendations request
  const [isLoading, setIsLoading] = useState(false);

  // Access query client for mutations
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Define payload type for the mutation
  type RecommendationPayload = {
    recommendations: string;
  };

  // Mutation for saving recommendations to the assessment
  const saveRecommendationsMutation = useMutation<
    any,
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
    if (isLoading || questions.length == 0 || assessment?.recommendations) {
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);

        // Same AI suggestions endpoint for both user types
        const response = await apiRequest("POST", "/api/ai-suggestions", {
          assessment: assessment,
        });

        const result = await response.json();
        if (!result.success || !result.recommendations) {
          throw new Error("Failed to generate recommendations");
        }

        // Create payload for saving recommendations
        const payload: RecommendationPayload = {
          recommendations: result.recommendations,
        };

        // Save recommendations
        await saveRecommendationsMutation.mutateAsync(payload);

        // Manually update assessment in local memory to prevent refetch
        if (assessment && result.recommendations) {
          assessment.recommendations = result.recommendations;
        }

        // Generate and save PDF automatically after recommendations are ready
        try {
          console.log("Generating PDF for assessment:", assessment.id);
          await generateAndSavePDF(assessment);
          console.log("PDF generated and saved successfully");
        } catch (pdfError) {
          console.error("PDF generation failed:", pdfError);
          // Don't block the user flow if PDF generation fails
        }

        toast({
          title: "Ready",
          description: "Recommendations generated and PDF prepared.",
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

  if (
    isLoading ||
    saveRecommendationsMutation.isPending ||
    assessment?.recommendations === null
  ) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Our AI agent is working to create actionable recommendations based
            on your assessment results. It will be ready in a moment - we will
            let you know once is done.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>
            {assessment.recommendations || "No recommendations found."}
          </ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
