import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CsvQuestion, Assessment } from "@shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Info } from "lucide-react";

// Define the data structure for category scores
interface CategoryScore {
  name: string;
  score: number;
}

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
  // Skip API call if not active tab
  const [hasActivated, setHasActivated] = useState(false);

  // Track if this tab has ever been activated
  useEffect(() => {
    if (isActive && !hasActivated) {
      setHasActivated(true);
    }
  }, [isActive]);

  // Only fetch data if tab has been activated
  const {
    data: suggestions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/ai-suggestions", assessment.id],
    queryFn: async () => {
      // Calculate category scores like in the chart
      const categoryScores = getCategoryScores();

      // Only make the API request if we have the needed data
      if (!categoryScores.length) {
        throw new Error("No category data available");
      }

      const payload = {
        assessmentTitle: `AI Readiness Assessment Q${Math.floor(new Date().getMonth() / 3 + 1)} ${new Date().getFullYear()}`,
        book: "The Lean Startup",
        categories: categoryScores,
        userEmail: assessment.email || undefined,
      };

      const response = await apiRequest("POST", "/api/ai-suggestions", payload);
      return await response.json();
    },
    enabled: hasActivated && !!assessment.id, // Only run if tab has been activated
  });

  // Function to calculate category scores based on assessment answers
  function getCategoryScores(): CategoryScore[] {
    const { answers = [] } = assessment;

    // Group questions by category
    const categoryMap = new Map<string, number[]>();

    questions.forEach((question: CsvQuestion, index: number) => {
      const category = question.category;
      if (!category) return;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      // Add this question's index to the category
      categoryMap.get(category)?.push(index);
    });

    // Calculate average score for each category
    const categoryScores = Array.from(categoryMap.entries()).map(
      ([name, questionIndices]) => {
        // Get answers for this category's questions
        const categoryAnswers = questionIndices
          .map((idx: number) => answers[idx])
          .filter((a: any) => a && a.a !== null);

        // Calculate average score
        const sum = categoryAnswers.reduce((acc: number, ans: any) => {
          // Convert from -2 to +2 scale to 0 to 10 scale
          const score = ((ans.a || 0) + 2) * 2.5;
          return acc + score;
        }, 0);

        const avgScore =
          categoryAnswers.length > 0
            ? Math.round((sum / categoryAnswers.length) * 10) / 10
            : 0;

        return {
          name,
          score: avgScore,
        };
      },
    );

    return categoryScores;
  }

  // If tab hasn't been activated yet, don't render anything substantial
  if (!hasActivated) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <p className="text-muted-foreground">
          Select this tab to generate AI recommendations
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Our AI agent is working to create some actionable recommendations.
            It will be ready in a moment.
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>{suggestions.content}</ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
