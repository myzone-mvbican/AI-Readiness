import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Minus } from "lucide-react";

interface BenchmarkData {
  quarter: string;
  surveyTemplateId: number;
  industry: string;
  categories: {
    name: string;
    userScore: number;
    industryAverage: number | null;
    globalAverage: number | null;
  }[];
}

interface PerformanceSummaryProps {
  assessmentId: number;
  className?: string;
}

export function PerformanceSummary({
  assessmentId,
  className,
}: PerformanceSummaryProps) {
  const {
    data: benchmarkData,
    isLoading,
    error,
  } = useQuery<{
    success: boolean;
    data: BenchmarkData;
  }>({
    queryKey: [`/api/surveys/benchmark/${assessmentId}`],
    enabled: !!assessmentId,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !benchmarkData?.success || !benchmarkData?.data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Performance data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data } = benchmarkData;

  // Calculate statistics
  const hasIndustryData = data.categories.some(
    (c) => c.industryAverage !== null,
  );
  const avgUserScore =
    data.categories.reduce((sum, c) => sum + c.userScore, 0) /
    data.categories.length;
  const avgIndustryScore = hasIndustryData
    ? data.categories
        .filter((c) => c.industryAverage !== null)
        .reduce((sum, c) => sum + (c.industryAverage || 0), 0) /
      data.categories.filter((c) => c.industryAverage !== null).length
    : null;
  const avgGlobalScore = 
    data.categories.reduce((sum, c) => sum + (c.globalAverage || 0), 0) /
    data.categories.length;

  const performanceIndicator = avgIndustryScore 
    ? avgUserScore > avgIndustryScore ? "above" : "below"
    : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quarter Label */}
        <div className="text-sm text-muted-foreground">
          {data.quarter}
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Your Average
              </span>
              <span className="font-semibold">
                {Math.round(avgUserScore) / 10}/10
              </span>
            </div>

            {hasIndustryData && avgIndustryScore && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Industry Average
                </span>
                <span className="font-semibold">
                  {Math.round(avgIndustryScore) / 10}/10
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Global Average
              </span>
              <span className="font-semibold">
                {Math.round(avgGlobalScore) / 10}/10
              </span>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Trend Analysis</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Minus className="h-4 w-4" />
            <span>First assessment - no trend data</span>
          </div>
        </div>

        {/* Performance Indicator */}
        {performanceIndicator && (
          <div className="space-y-2">
            <Badge
              variant={
                performanceIndicator === "above" ? "default" : "secondary"
              }
              className={
                performanceIndicator === "above"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : ""
              }
            >
              {performanceIndicator === "above"
                ? "Above Average"
                : "Below Average"}
            </Badge>
          </div>
        )}

        {/* Data Source Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          {hasIndustryData
            ? `Based on ${data.industry} submissions in ${data.quarter}`
            : "Using global benchmarks (insufficient industry data)"}
        </div>
      </CardContent>
    </Card>
  );
}