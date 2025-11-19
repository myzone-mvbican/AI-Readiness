import ReactMarkdown from "react-markdown";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Survey, Assessment } from "@shared/types";
import { RecommendationsV2 } from "@shared/schema";

interface ScreenRecommendations {
  assessment: Assessment & { survey?: Survey };
  isLoading?: boolean;
}

// Type guard to check if recommendations is V2 format
export function isV2Recommendations(
  recommendations: any,
): recommendations is RecommendationsV2 {
  return (
    typeof recommendations === "object" &&
    recommendations !== null &&
    (recommendations.version === 2 ||
      (recommendations.intro &&
        recommendations.categories &&
        recommendations.outro))
  );
}

export default function ScreenRecommendations({
  assessment,
  isLoading,
}: ScreenRecommendations) {
  if (isLoading) {
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

  // Check if we have V2 structured recommendations
  if (isV2Recommendations(assessment.recommendations)) {
    const recommendations = assessment.recommendations;

    return (
      <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
        <div className="space-y-6">
          {/* Categories Section */}
          <div className="space-y-4">
            <h3 className="text-lg text-muted-foreground font-semibold">
              Detailed Analysis by Category
            </h3>
            {recommendations.categories.map((category, index) => {
              const trendIcon =
                category.performance.trend === "improving" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : category.performance.trend === "declining" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                );

              const scorePercentage =
                (category.performance.currentScore / 10) * 100;
              const benchmarkPercentage =
                category.performance.benchmark !== undefined &&
                category.performance.benchmark !== null
                  ? (category.performance.benchmark / 10) * 100
                  : null;

              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">{category.emoji}</span>
                          {category.name}
                        </CardTitle>
                      </div>
                      {category.performance.trend && (
                        <Badge variant="outline" className="ml-4">
                          <div className="flex items-center gap-1">
                            {trendIcon}
                            {category.performance.trend}
                          </div>
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Your Score</span>
                        <span className="font-bold">
                          {category.performance.currentScore}/10
                        </span>
                      </div>
                      <Progress value={scorePercentage} className="h-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                    {/* Performance Metrics */}
                    <div className="space-y-3">
                      {benchmarkPercentage !== null && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted-foreground">
                              Industry Benchmark
                            </span>
                            <span className="font-semibold text-muted-foreground">
                              {category.performance.benchmark}/10
                            </span>
                          </div>
                          <Progress
                            value={benchmarkPercentage}
                            className="h-2 opacity-50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Best Practices */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2">
                        {category.bestPractices.map((practice, idx) => (
                          <li key={idx} className="flex gap-2 text-xs">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="flex-1">{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Outro Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="markdown-text text-xs leading-relaxed">
                <ReactMarkdown>{recommendations.rocks}</ReactMarkdown>
                <p className="text-xs leading-relaxed">
                  {recommendations.outro}
                </p>
              </div>
              <div className="flex justify-start pt-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto"
                  data-testid="button-outro-get-help"
                >
                  <a
                    href="https://calendly.com/keeranmfj/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule a Consultation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  // V1 format - display as markdown
  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>
            {typeof assessment.recommendations === "string"
              ? assessment.recommendations
              : "No recommendations found."}
          </ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
