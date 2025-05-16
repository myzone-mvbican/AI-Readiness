import { CheckCircle2, InfoIcon, Download } from "lucide-react";
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
import { ChartContainer } from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CsvQuestion, Assessment } from "@shared/types";
import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { AssessmentPDFDownloadButton } from './assessment-pdf';

interface SurveyCompletedProps {
  assessment: Assessment;
  questions?: CsvQuestion[];
}

export default function SurveyCompleted({
  assessment,
  questions = [],
}: SurveyCompletedProps) {
  const { answers = [] } = assessment;
  const chartRef = useRef<HTMLDivElement>(null);
  const responsesRef = useRef<HTMLDivElement>(null);
  const [chartImageUrl, setChartImageUrl] = useState("");
  
  // Function to capture chart for PDF export
  const captureChart = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      
      const imageUrl = canvas.toDataURL("image/png");
      setChartImageUrl(imageUrl);
    } catch (error) {
      console.error("Error capturing chart:", error);
    }
  };
  
  // Capture chart when component mounts and when assessment changes
  useEffect(() => {
    const timer = setTimeout(() => {
      captureChart();
    }, 500); // Delay chart capture to ensure it's rendered
    
    return () => clearTimeout(timer);
  }, [assessment]);

  // Define radar chart data type
  interface RadarChartData {
    subject: string;
    score: number;
    fullMark: number;
  }

  // Function to prepare data for radar chart
  const getRadarChartData = (): RadarChartData[] => {
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
      ([category, questionIndices]) => {
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

  // We're using React PDF instead of jsPDF for better layout control
  // See assessment-pdf.tsx for the implementation

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start py-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-start">
            <h2 className="text-2xl text-foreground font-bold">
              Assessment Completed
            </h2>
            <p className="text-muted-foreground mt-2">
              You scored {assessment.score} out of 100 on this AI readiness
              assessment.
            </p>
          </div>
        </div>
        <AssessmentPDFDownloadButton
          assessment={assessment}
          questions={questions}
          chartImageUrl={chartImageUrl}
        />
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
                <span>AI Readiness Score: {assessment.score ?? 0}/100</span>
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
              <div className="py-4" ref={chartRef}>
                <ChartContainer
                  config={{
                    // Config for the score data point
                    score: {
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[350px] w-full"
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
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="responses">
          <ScrollArea className="h-[500px] rounded-md border p-4">
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
      </Tabs>
    </div>
  );
}
