import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Download, BarChart, RefreshCw, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AssessmentAnswer } from "@shared/types";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip as RechartsTooltip,
  ResponsiveContainer 
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AssessmentCompletionProps {
  assessment: any;
  survey: any;
  guestMode?: boolean;
  onSignUp?: () => void;
  onStartNew?: () => void;
}

export function AssessmentCompletion({
  assessment,
  survey,
  guestMode = false,
  onSignUp,
  onStartNew,
}: AssessmentCompletionProps) {
  if (!assessment) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>Assessment data not available.</p>
        </CardContent>
      </Card>
    );
  }

  const score = assessment.score || 0;
  const getScoreColor = (score: number) => {
    if (score < 30) return "text-red-500";
    if (score < 60) return "text-amber-500";
    return "text-green-500";
  };

  const getScoreDescription = (score: number) => {
    if (score < 30) return "Beginning";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Leading";
  };

  // Prepare data for radar chart
  const getRadarChartData = () => {
    // Group answers by category
    const categoryMap = new Map<string, AssessmentAnswer[]>();
    
    if (!assessment.answers || !Array.isArray(assessment.answers)) {
      return [];
    }

    // Process answers and group by category
    assessment.answers.forEach((answer: AssessmentAnswer, index: number) => {
      // Get the question from survey data
      const questionNumber = answer.q;
      // Find the matching question
      const question = survey?.questions?.find((q: any) => q.id === questionNumber);
      
      if (!question) return;
      
      const category = question.category;
      if (!category) return;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      
      // Add this answer to the category
      categoryMap.get(category)?.push(answer);
    });
    
    // Calculate average score for each category
    return Array.from(categoryMap.entries()).map(([category, answers]) => {
      // Get valid answers with values
      const validAnswers = answers.filter(a => a.a !== null && a.a !== undefined);
      if (validAnswers.length === 0) return { subject: category, score: 0, fullMark: 10 };
      
      // Convert from -2 to +2 scale to 0 to 10 scale
      const sum = validAnswers.reduce((acc, ans) => {
        const value = ans.a || 0;
        // Convert to 0-10 scale: (-2 → 0, -1 → 2.5, 0 → 5, 1 → 7.5, 2 → 10)
        const normalizedValue = ((value + 2) * 2.5);
        return acc + normalizedValue;
      }, 0);
      
      const avg = validAnswers.length > 0 
        ? Math.round((sum / validAnswers.length) * 10) / 10 
        : 0;
      
      return {
        subject: category,
        score: avg,
        fullMark: 10,
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center py-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="text-center">
          <CardTitle className="text-2xl">Assessment Completed</CardTitle>
          <CardDescription className="mt-2">
            You scored {score} out of 100 on this AI readiness assessment.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="responses">Your Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="p-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <ChartContainer
                    config={{
                      type: 'radar-chart',
                      height: 350,
                      data: getRadarChartData(),
                      options: {},
                    } as ChartConfig}
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
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {assessment.answers && assessment.answers.map((answer: AssessmentAnswer, index: number) => {
                // Get the question
                const questionNumber = answer.q;
                const question = survey?.questions?.find((q: any) => q.id === questionNumber);
                if (!question) return null;
                
                // Calculate answer value text
                const answerValue = answer.a;
                let answerText = "Not answered";
                if (answerValue === -2) answerText = "Strongly Disagree";
                else if (answerValue === -1) answerText = "Disagree";
                else if (answerValue === 0) answerText = "Neutral";
                else if (answerValue === 1) answerText = "Agree";
                else if (answerValue === 2) answerText = "Strongly Agree";
                
                return (
                  <div key={index} className="mb-4">
                    <p className="font-medium">{question.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">Your answer: {answerText}</p>
                    <Separator className="my-2" />
                  </div>
                );
              })}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-center gap-4 mt-4">
        {guestMode && onSignUp && (
          <Button
            className="w-full sm:w-auto px-6"
            onClick={onSignUp}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Account
          </Button>
        )}
        
        <Button
          variant="outline"
          className="w-full sm:w-auto px-6"
          onClick={() => {
            // Download feature would be implemented here
            alert("Download functionality would be implemented here");
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        
        {onStartNew && (
          <Button
            variant="outline"
            className="w-full sm:w-auto px-6"
            onClick={onStartNew}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Assessment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}