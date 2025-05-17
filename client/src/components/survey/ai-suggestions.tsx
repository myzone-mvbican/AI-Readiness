import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CsvQuestion, Assessment } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  // States for tracking the suggestions
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [content, setContent] = useState<string | null>(assessment.recommendations || null);
  const [apiCallInitiated, setApiCallInitiated] = useState(false);
  
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

  // Effect to get or generate recommendations only once
  useEffect(() => {
    // Skip if we already have content or the API call was already initiated
    if (content || apiCallInitiated || !assessment.id) {
      return;
    }
    
    // Mark that we've initiated the API call to prevent duplicates
    setApiCallInitiated(true);
    
    // Function to generate recommendations
    const generateRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we already have recommendations stored, use those
        if (assessment.recommendations) {
          setContent(assessment.recommendations);
          return;
        }
        
        // Calculate category scores
        const categoryScores = getCategoryScores(assessment, questions);
        
        if (!categoryScores.length) {
          throw new Error("No category data available");
        }
        
        const payload = {
          assessmentTitle: assessment.title || "AI Readiness Assessment",
          book: "The Lean Startup",
          categories: categoryScores,
          userEmail: assessment.email || undefined,
        };
        
        // Only make a single API call
        const response = await apiRequest("POST", "/api/ai-suggestions", payload);
        const result = await response.json();
        
        if (result.success && result.content) {
          setContent(result.content);
          saveRecommendationsMutation.mutate(result.content);
        } else {
          throw new Error("Failed to generate recommendations");
        }
      } catch (err) {
        console.error("Error generating AI suggestions:", err);
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    };
    
    // Attempt to generate recommendations if active or if we have stored recommendations
    if (isActive || assessment.recommendations) {
      generateRecommendations();
    }
  }, [isActive, assessment.id, assessment.recommendations, content, apiCallInitiated]);

  // Update content if assessment recommendations change
  useEffect(() => {
    if (assessment.recommendations && !content) {
      setContent(assessment.recommendations);
    }
  }, [assessment.recommendations]);

  // If tab isn't active, show minimal message
  if (!isActive) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading 
            ? "AI recommendations are being generated in the background..."
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
          <ReactMarkdown>{content || 'No recommendations found.'}</ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
