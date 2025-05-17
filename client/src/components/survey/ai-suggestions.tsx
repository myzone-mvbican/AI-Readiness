import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CsvQuestion, Assessment } from "@shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCategoryScores } from "@/lib/generateRecommendations";

interface AISuggestionsProps {
  assessment: Assessment;
  questions: CsvQuestion[];
  isActive: boolean;
}

export default function AISuggestions({
  assessment,
  questions,
  isActive,
}: AISuggestionsProps) {
  // Check if recommendations already exist in the assessment
  const hasStoredRecommendations = !!assessment.recommendations;
  
  // Track if we should generate recommendations (once only)
  const [shouldGenerate, setShouldGenerate] = useState(false);
  
  // Effect to control when recommendations should be generated
  useEffect(() => {
    // Only enable generation if:
    // 1. The tab is active
    // 2. No recommendations exist yet
    // 3. We haven't already triggered generation
    if (isActive && !hasStoredRecommendations && !shouldGenerate) {
      setShouldGenerate(true);
    }
  }, [isActive, hasStoredRecommendations, shouldGenerate]);

  // Access query client for mutations
  const queryClient = useQueryClient();

  // Mutation for saving recommendations to the assessment
  const saveRecommendationsMutation = useMutation({
    mutationFn: async (recommendationText: string) => {
      const response = await apiRequest(
        "PATCH",
        `/api/assessments/${assessment.id}`,
        {
          recommendations: recommendationText,
        },
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/assessments/${assessment.id}`],
      });
    },
  });

  // Query to get recommendations - either from stored data or generate new ones
  const {
    data: suggestions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/ai-suggestions", assessment.id],
    queryFn: async () => {
      // If recommendations exist, just return them
      if (hasStoredRecommendations) {
        return { success: true, content: assessment.recommendations };
      }

      // Calculate category scores for the API request
      const categoryScores = getCategoryScores(assessment, questions);

      if (!categoryScores.length) {
        throw new Error("No category data available");
      }

      const payload = {
        assessmentTitle: assessment.title, // Added title for context
        book: "The Lean Startup",
        categories: categoryScores,
        userEmail: assessment.email || undefined,
      };

      // Generate recommendations from OpenAI
      const response = await apiRequest("POST", "/api/ai-suggestions", payload);
      const result = await response.json();

      // Save recommendations if successful
      if (result.success && result.content) {
        saveRecommendationsMutation.mutate(result.content);
      }

      return result;
    },
    // Only enable in these cases:
    // 1. If recommendations already exist (just display them)
    // 2. If we've explicitly set shouldGenerate to true (once per session)
    enabled: (hasStoredRecommendations || shouldGenerate) && !!assessment.id,
    // Prevent refetching once we have data
    staleTime: Infinity,
  });

  // If recommendations are being generated in the background
  // but this tab isn't active, don't show loading spinner
  if (!isActive && !hasStoredRecommendations) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading 
            ? "AI recommendations are being generated..."
            : "Select this tab to view AI recommendations"}
        </p>
      </div>
    );
  }

  // Show loading state when visible
  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Our AI agent is working to create actionable recommendations
            based on your assessment results. It will be ready in a moment.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-[calc(100dvh-330px)] p-4">
        <Alert variant="destructive">
          <AlertTitle>Error generating recommendations</AlertTitle>
          <AlertDescription>
            We couldn't generate AI recommendations at this time. Please try
            again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show recommendations
  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>{suggestions?.content || 'No recommendations found.'}</ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
