import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Minus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

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

export function PerformanceSummaryCard() {
  const { user } = useAuth();

  // Fetch user's completed assessments to show benchmark data
  const { data: assessments } = useQuery<{
    success: boolean;
    assessments: Array<{
      id: number;
      title: string;
      status: string;
      completedOn: string | null;
      score: number | null;
    }>;
  }>({
    queryKey: ["/api/assessments"],
    enabled: !!user,
  });

  // Find the most recent completed assessment for benchmark comparison
  const latestCompletedAssessment = assessments?.assessments
    ?.filter((a) => a.status === "completed" && a.completedOn)
    ?.sort(
      (a, b) =>
        new Date(b.completedOn!).getTime() - new Date(a.completedOn!).getTime(),
    )?.[0];

  const {
    data: benchmarkData,
    isLoading,
    error,
  } = useQuery<{
    success: boolean;
    data: BenchmarkData;
  }>({
    queryKey: [`/api/assessments/${latestCompletedAssessment?.id}/benchmark`],
    enabled: !!latestCompletedAssessment?.id,
  });

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-center text-lg font-medium">
            Performance Summary
          </CardTitle>
          <CardDescription className="text-center">
            Your organization's AI readiness performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-center text-muted-foreground">
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !benchmarkData?.success || !benchmarkData?.data) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-center text-lg font-medium">
            Performance Summary
          </CardTitle>
          <CardDescription className="text-center">
            Your organization's AI readiness performance
          </CardDescription>
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
    ? avgUserScore > avgIndustryScore
      ? "above"
      : "below"
    : avgUserScore > avgGlobalScore
      ? "above"
      : "below";

  const { company = "Your organization" } = user || {};

  return (
    <Card className="col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-lg font-medium">
          Performance Summary
        </CardTitle>
        <CardDescription className="text-center">
          {company}'s AI readiness performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Indicator */}
        {performanceIndicator && (
          <div className="flex justify-center">
            <Badge
              variant={
                performanceIndicator === "above" ? "success" : "destructive"
              }
            >
              {performanceIndicator === "above"
                ? "Above Average"
                : "Below Average"}
            </Badge>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Your Average</span>
            <span className="font-semibold">
              {Math.round(avgUserScore) / 10}/10
            </span>
          </div>

          {hasIndustryData && avgIndustryScore && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Industry Average</span>
              <span className="font-semibold">
                {Math.round(avgIndustryScore) / 10}/10
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Global Average</span>
            <span className="font-semibold">
              {Math.round(avgGlobalScore) / 10}/10
            </span>
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
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-4 border-t border-border">
        {hasIndustryData
          ? `Based on ${data.industry} submissions in ${data.quarter}`
          : "Using global benchmarks (insufficient industry data)"}
      </CardFooter>
    </Card>
  );
}
