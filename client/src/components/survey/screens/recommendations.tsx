import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastAction } from "@/components/ui/toast";
import { navigate } from "wouter/use-browser-location";
import { Survey, Assessment } from "@shared/types";
import { getCategoryScores } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
      // Determine which endpoint to use based on authentication status
      const endpoint = isAuthenticated
        ? `/api/assessments/${assessment.id}`
        : `/api/public/assessments/${assessment.id}`;

      // For authenticated users, we don't need to include email
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

        const categoryScores = getCategoryScores(assessment);
        if (!categoryScores.length) {
          throw new Error("No category scores available");
        }

        // Get company data from assessment
        let companyData = null;
        if (isAuthenticated) {
          const { company, employeeCount, industry } = user || {};
          companyData = {
            name: company,
            employeeCount: employeeCount,
            industry: industry,
          };
        } else if (assessment.guest) {
          try {
            const guestData = JSON.parse(assessment.guest);
            companyData = {
              name: guestData.company || "",
              employeeCount: guestData.employeeCount || "",
              industry: guestData.industry || "",
            };
          } catch (error) {
            console.error("Error parsing guest data:", error);
          }
        }

        // Same AI suggestions endpoint for both user types
        const response = await apiRequest("POST", "/api/ai-suggestions", {
          categories: categoryScores,
          ...(companyData && { company: companyData }),
        });

        const result = await response.json();
        if (!result.success || !result.content) {
          throw new Error("Failed to generate recommendations");
        }

        // Create payload for saving recommendations
        const payload: RecommendationPayload = {
          recommendations: result.content,
        };

        // Save recommendations
        await saveRecommendationsMutation.mutateAsync(payload);

        // Manually update assessment in local memory to prevent refetch
        if (assessment && result.content) {
          assessment.recommendations = result.content;
        }

        toast({
          title: "Ready",
          description: "Recommendations generated.",
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
