import { DashboardLayout } from "@/components/layout/dashboard";
import { CheckCircle2, InfoIcon } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SurveyQuestion {
  number: number;
  category: string;
  text: string;
  detail?: string;
}

interface SurveyCompletedProps {
  assessment: {
    title: string;
    score: number | null;
    answers: Array<{
      q: number | null | undefined;
      a: 0 | 2 | 1 | -1 | -2 | null | undefined;
    }>;
  };
  surveyQuestions: SurveyQuestion[];
}

export default function SurveyError({
  assessment,
  surveyQuestions,
}: SurveyErrorProps) {
  const { answers = [] } = assessment;

  // Function to prepare data for radar chart
  const getRadarChartData = () => {
    // Group questions by category
    const categoryMap = new Map();

    surveyQuestions.forEach((question, index) => {
      const category = question.category;
      if (!category) return;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      // Add this question's index to the category
      categoryMap.get(category).push(index);
    });

    // Calculate average score for each category
    const categoryScores = Array.from(categoryMap.entries()).map(
      ([category, questionIndices]) => {
        // Get answers for this category's questions
        const categoryAnswers = questionIndices
          .map((idx) => answers[idx])
          .filter((a) => a && a.a !== null);

        // Calculate average score
        const sum = categoryAnswers.reduce((acc, ans) => {
          // Convert from -2 to +2 scale to 0 to 10 scale
          const score = (ans.a + 2) * 2.5;
          return acc + score;
        }, 0);

        const avg =
          categoryAnswers.length > 0
            ? Math.round((sum / categoryAnswers.length) * 10) / 10
            : 0;

        return {
          subject: category,
          score: avg,
          fullMark: 10,
        };
      },
    );

    return categoryScores;
  };

  // Helper function to find question text by ID
  const getQuestionTextById = (questionId: string) => {
    // Convert questionId string to number
    const qId = parseInt(questionId, 10);
    // Find the matching question by number
    const question = surveyQuestions.find((q) => q.number === qId);
    return question?.text || `Question ${questionId}`;
  };

  return (
    <DashboardLayout title={assessment.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-center py-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">Assessment Completed</h2>
          <p className="text-muted-foreground mt-2">
            You scored {assessment.score} out of 100 on this AI readiness
            assessment.
          </p>
        </div>

        <Tabs defaultValue="results" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="responses">Your Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-x-3">
                  <span>AI Readiness Score: {assessment.score}/100</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className="p-2">
                      This score represents your organization's current AI
                      readiness level
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>
                  Based on your responses, your organization is at the
                  {assessment.score >= 80
                    ? " advanced "
                    : assessment.score >= 60
                      ? " intermediate "
                      : assessment.score >= 40
                        ? " developing "
                        : " beginning "}
                  stage of AI readiness.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4">
                  <ChartContainer className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius="80%" data={getRadarChartData()}>
                        <PolarGrid strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{
                            fill: "var(--foreground)",
                            fontSize: 12,
                          }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 10]}
                          tick={{ fill: "var(--foreground)" }}
                        />
                        <Radar
                          name="Organization Score"
                          dataKey="score"
                          stroke="var(--primary)"
                          fill="var(--primary)"
                          fillOpacity={0.5}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              return (
                                <ChartTooltipContent
                                  className="rounded-lg border bg-background p-2 shadow-sm"
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Category
                                      </span>
                                      <span className="font-bold">
                                        {data.payload.subject}
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
                                </ChartTooltipContent>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="responses">
            <ScrollArea className="h-[500px] rounded-md border p-4">
              {answers.map((answer, index) => (
                <div key={answer.q}>
                  <h3 className="text-sm md:text-normal font-medium">
                    Question {index + 1}: {getQuestionTextById(answer.q)}
                  </h3>
                  <p className="text-sm mt-2">
                    Your answer:{" "}
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
                  </p>
                  <Separator className="my-4" />
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
