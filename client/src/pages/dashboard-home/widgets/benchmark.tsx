import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  TrendingUp,
  Users,
  Building2,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

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

interface BenchmarkWidgetProps {
  assessmentId: number;
  className?: string;
}

export function BenchmarkWidget({
  assessmentId,
  className,
}: BenchmarkWidgetProps) {
  const [showGlobal, setShowGlobal] = useState(false);

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
            Your AI Readiness vs Industry Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-muted-foreground">
              Loading benchmark data...
            </div>
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
            Your AI Readiness vs Industry Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Benchmark data not available</p>
              <p className="text-sm mt-2">
                Complete more assessments to see industry comparisons
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data } = benchmarkData;

  // Prepare chart data (0-10 scale) and choose which comparison to show
  const chartData = data.categories.map((category) => {
    const benchmarkValue = showGlobal
      ? category.globalAverage
      : category.industryAverage;

    return {
      name: category.name.replace(/ & /g, " &\n"), // Add line breaks for better readability
      userScore: Math.round(category.userScore) / 10, // userScore is 0-100, convert to 0-10
      benchmark: benchmarkValue ? Math.round(benchmarkValue) / 10 : null, // benchmarkValue is 0-100, convert to 0-10
    };
  });

  // Chart configuration for shadcn charts
  const chartConfig = {
    userScore: {
      label: "Your Score",
      color: "hsl(var(--chart-1))",
    },
    benchmark: {
      label: showGlobal ? "Global Average" : "Industry Average",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Calculate statistics (convert to 0-10 scale for display)
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

  const performanceIndicator = avgIndustryScore
    ? avgUserScore > avgIndustryScore
      ? "above"
      : "below"
    : null;

  return (
    <TooltipProvider>
      <Card className="col-span-2 lg:col-span-3 xl:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your AI Readiness vs Industry Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Chart Section - Reduced Width */}
            <div className="flex-1">
              <ChartContainer config={chartConfig}>
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={11}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar 
                    dataKey="userScore" 
                    fill="var(--color-userScore)" 
                    radius={4} 
                  />
                  <Bar 
                    dataKey="benchmark" 
                    fill="var(--color-benchmark)" 
                    radius={4} 
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Sidebar Section */}
            <div className="w-64 space-y-4">
            {/* Quarter and Toggle Badge */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {data.quarter}
              </div>

              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 cursor-pointer hover:bg-muted transition-colors w-fit"
                    onClick={() => setShowGlobal(!showGlobal)}
                  >
                    {showGlobal ? (
                      <>
                        <Globe className="h-3 w-3" />
                        Global
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3 w-3" />
                        {data.industry}
                      </>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Switch to {showGlobal ? "Industry" : "Global"} comparison
                  </p>
                </TooltipContent>
              </ShadcnTooltip>
            </div>

            {/* Performance Summary */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Performance Summary</div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Your Average
                  </span>
                  <span className="font-semibold">
                    {Math.round(avgUserScore) / 10}/10
                  </span>
                </div>

                {avgIndustryScore && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {showGlobal ? "Global" : "Industry"} Average
                    </span>
                    <span className="font-semibold">
                      {Math.round(avgIndustryScore) / 10}/10
                    </span>
                  </div>
                )}
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
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
