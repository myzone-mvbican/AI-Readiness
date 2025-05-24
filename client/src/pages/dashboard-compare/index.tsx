import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

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

export default function DashboardCompare() {
  const { user } = useAuth();
  const [activeChart, setActiveChart] = useState<"industry" | "global">(
    "global",
  );

  // Fetch user's completed assessments
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

  // Find the most recent completed assessment
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
    queryKey: [`/api/surveys/benchmark/${latestCompletedAssessment?.id}`],
    enabled: !!latestCompletedAssessment?.id,
  });

  if (!latestCompletedAssessment) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Benchmark Comparison
            </h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed assessments found</p>
                <p className="text-sm mt-2">
                  Complete an assessment to see benchmark comparisons
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Benchmark Comparison
            </h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse text-muted-foreground text-center">
                Loading benchmark data...
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !benchmarkData?.success || !benchmarkData?.data) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Benchmark Comparison
            </h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Benchmark data not available</p>
                <p className="text-sm mt-2">
                  Please try again later or contact support
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
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

  // Calculate total averages for the switcher display
  const userTotal = Math.round(avgUserScore) / 10;
  const industryTotal =
    hasIndustryData && avgIndustryScore
      ? Math.round(avgIndustryScore) / 10
      : null;
  const globalTotal = Math.round(avgGlobalScore) / 10;

  // Prepare chart data based on active comparison
  const chartData = data.categories.map((category) => {
    const benchmarkValue =
      activeChart === "industry"
        ? category.industryAverage
        : category.globalAverage;

    return {
      name: category.name.replace(/ & /g, " &\n"),
      userScore: Math.round(category.userScore) / 10,
      benchmark: benchmarkValue ? Math.round(benchmarkValue) / 10 : null,
    };
  });

  // Chart configuration
  const chartConfig = {
    userScore: {
      label: "Your Score",
      color: "hsl(var(--chart-1))",
    },
    benchmark: {
      label: activeChart === "industry" ? "Industry Average" : "Global Average",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-foreground" />
              <h2 className="text-xl text-foreground font-semibold">
                Your Assessments
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              {activeChart === "industry" 
                ? "Your AI Readiness vs Industry Benchmarks." 
                : "Your AI Readiness vs Global Benchmarks."
              }
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {activeChart === "industry" 
                ? "Benchmark Comparison with Industry Average" 
                : "Benchmark Comparison with Global Average"
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-7">
              {/* Left-aligned Scale Legend */}
              <div className="md:col-span-1 flex flex-col justify-center items-center pr-4">
                <div className="text-xs text-muted-foreground mb-2 transform -rotate-90 whitespace-nowrap">
                  Score (0-10)
                </div>
                <div className="flex flex-col space-y-2 text-xs text-muted-foreground">
                  <div>10</div>
                  <div>8</div>
                  <div>6</div>
                  <div>4</div>
                  <div>2</div>
                  <div>0</div>
                </div>
              </div>
              
              <div className="md:col-span-4">
                {/* Chart */}
                <ChartContainer config={chartConfig}>
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickMargin={10} fontSize={9} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="userScore"
                      fill="var(--color-userScore)"
                      radius={4}
                    >
                      <LabelList
                        dataKey="userScore"
                        position="insideTop"
                        className="fill-background"
                        fontSize={12}
                        formatter={(value: number) =>
                          value > 0 ? `${value.toFixed(1)}` : ""
                        }
                      />
                    </Bar>
                    <Bar
                      dataKey="benchmark"
                      fill="var(--color-benchmark)"
                      radius={4}
                    >
                      <LabelList
                        dataKey="benchmark"
                        position="insideTop"
                        className="fill-background"
                        fontSize={12}
                        formatter={(value: number) =>
                          value > 0 ? `${value.toFixed(1)}` : ""
                        }
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="md:col-span-2 p-3 bg-muted rounded-lg">
                {/* Interactive Switcher Header */}
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-3 w-3 rounded-full bg-chart-1" />
                        Your Score
                      </div>
                      <div className="text-2xl font-bold">
                        {userTotal.toFixed(1)}
                      </div>
                    </div>

                    {hasIndustryData && industryTotal && (
                      <div
                        className={`grid gap-2 cursor-pointer rounded-lg p-2 transition-colors ${
                          activeChart === "industry"
                            ? "bg-white"
                            : "hover:bg-white/50"
                        }`}
                        onClick={() => setActiveChart("industry")}
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-3 w-3 rounded-full bg-chart-2" />
                          Industry
                        </div>
                        <div className="text-2xl font-bold">
                          {industryTotal.toFixed(1)}
                        </div>
                      </div>
                    )}

                    <div
                      className={`grid gap-2 cursor-pointer rounded-lg p-2 transition-colors ${
                        activeChart === "global"
                          ? "bg-white"
                          : "hover:bg-white/50"
                      }`}
                      onClick={() => setActiveChart("global")}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-3 w-3 rounded-full bg-chart-2" />
                        Global
                      </div>
                      <div className="text-2xl font-bold">
                        {globalTotal.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {activeChart === "industry" 
                ? `Based on ${data.industry} submissions in ${data.quarter}`
                : `Based on global submissions in ${data.quarter}`
              }
            </p>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
