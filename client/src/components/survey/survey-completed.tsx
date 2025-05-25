import { useRef, useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { ChartContainer } from "@/components/ui/chart";
import { navigate } from "wouter/use-browser-location";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CsvQuestion, Assessment } from "@shared/types";
import { AssessmentPDFDownloadButton } from "./assessment-pdf";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { getCategoryScores } from "@/lib/generateRecommendations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ScreenCompare from "./screens/compare";

interface SurveyCompletedProps {
  assessment: Assessment;
  questions?: CsvQuestion[];
  additionalActions?: React.ReactNode;
}

// Define radar chart data type
interface RadarChartData {
  name: string;
  score: number;
  fullMark: number;
}

export default function SurveyCompleted({
  assessment,
  questions = [],
  additionalActions,
}: SurveyCompletedProps) {
  const { toast } = useToast();
  const { answers = [] } = assessment;
  const responsesRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

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

        const categoryScores = getCategoryScores(assessment, questions);
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

  // Function to prepare data for radar chart
  const getRadarChartData = (): RadarChartData[] => {
    return getCategoryScores(assessment, questions).map((category) => ({
      ...category,
      subject: category.name,
      fullMark: 10,
    }));
  };

  // Helper function to find question text by ID
  const getQuestionTextById = (
    questionId: number | null | undefined,
  ): string => {
    if (questionId === null || questionId === undefined) {
      return `Unknown Question`;
    }
    // Find the matching question by number
    const question = questions.find((q: CsvQuestion) => q.id === questionId);
    return question?.question || `Question ${questionId}`;
  };

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
              You scored {assessment.score} out of 100 on this AI readiness
              assessment.
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
            {isLoading ||
            saveRecommendationsMutation.isPending ||
            assessment?.recommendations === null ? (
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
              <AssessmentPDFDownloadButton
                assessment={assessment}
                questions={questions}
                chartData={getRadarChartData()}
              />
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
              <TooltipContent className="p-2">
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
              <TooltipContent className="p-2">
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
              <TooltipContent className="p-2">
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
              <TooltipContent className="p-2">
                Compare your assessment with others.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-x-3">
                <span>AI Readiness Score: {assessment.score ?? 0}/100</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2">
                    This score represents your organization's current AI
                    readiness level.
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Based on your responses, your organization is at the
                {(assessment.score ?? 0) >= 80
                  ? " advanced "
                  : (assessment.score ?? 0) >= 60
                    ? " intermediate "
                    : (assessment.score ?? 0) >= 40
                      ? " developing "
                      : " beginning "}
                stage of AI readiness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  // Config for the score data point
                  score: {
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[calc(100dvh-480px)] w-full"
                ref={chartRef}
              >
                <RadarChart outerRadius="80%" data={getRadarChartData()}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "hsl(var(--foreground))",
                      fontSize: 12,
                    }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 10]}
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <Radar
                    name="Organization Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                    dot={{
                      r: 4,
                      fillOpacity: 1,
                    }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Category
                                </span>
                                <span className="font-bold">
                                  {data.payload.name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Score
                                </span>
                                <span className="font-bold">
                                  {data.value}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
            <div ref={responsesRef}>
              {answers.map((answer: any, index: number) => (
                <div key={`answer-${index}`}>
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm text-foreground md:text-base font-medium flex-1">
                      Question {index + 1}: {getQuestionTextById(answer.q)}
                    </h3>
                    {questions.find((q) => q.id === answer.q)?.details && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 dark:text-white flex-shrink-0 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent className="p-2 max-w-[400px]">
                          {questions.find((q) => q.id === answer.q)?.details}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your answer:{" "}
                    <span className="font-medium">
                      {answer.a === 2
                        ? "Strongly Agree"
                        : answer.a === 1
                          ? "Agree"
                          : answer.a === 0
                            ? "Neutral"
                            : answer.a === -1
                              ? "Disagree"
                              : answer.a === -2
                                ? "Strongly Disagree"
                                : "Not answered"}
                    </span>
                  </p>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="suggestions">
          {isLoading ||
          saveRecommendationsMutation.isPending ||
          assessment?.recommendations === null ? (
            <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Our AI agent is working to create actionable recommendations
                  based on your assessment results. It will be ready in a moment
                  - we will let you know once is done.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
              <div className="space-y-6">
                <div className="markdown-text">
                  <ReactMarkdown>
                    {assessment.recommendations || "No recommendations found."}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="compare">
          <ScreenCompare
            assessmentId={assessment.id}
            isAuthenticated={isAuthenticated}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
