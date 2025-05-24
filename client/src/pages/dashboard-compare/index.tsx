import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  Pie,
  PieChart,
  Sector,
  Label,
} from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
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
  ChartStyle,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [activeView, setActiveView] = useState<
    "yourScore" | "industry" | "global"
  >("yourScore");

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
    queryKey: [`/api/assessments/${latestCompletedAssessment?.id}/benchmark`],
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

  const { company = "Your company", industry = "Industry" } = user || {};

  // Prepare pie chart data for company/industry/global comparison
  const pieChartData = [
    {
      type: "company",
      value: userTotal * 10, // Convert back to 0-10 scale for display
      fill: "hsl(var(--chart-1))",
    },
    ...(hasIndustryData && industryTotal ? [{
      type: "industry", 
      value: industryTotal * 10,
      fill: "hsl(var(--chart-2))",
    }] : []),
    {
      type: "global",
      value: globalTotal * 10,
      fill: "hsl(var(--chart-3))",
    },
  ];

  const pieChartId = "pie-interactive";

  // Get the selected score for pie chart center
  let selectedScore = userTotal * 10;
  if (activeView === "industry" && industryTotal) {
    selectedScore = industryTotal * 10;
  } else if (activeView === "global") {
    selectedScore = globalTotal * 10;
  }

  // Chart configuration
  const chartConfig = {
    userScore: {
      label: `${company} score`,
      color: "hsl(var(--chart-1))",
    },
    benchmark: {
      label:
        activeChart === "industry" ? `${industry} average` : "Global average",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Pie chart configuration
  const pieChartConfig = {
    company: {
      label: company,
      color: "hsl(var(--chart-1))",
    },
    industry: {
      label: industry,
      color: "hsl(var(--chart-2))",
    },
    global: {
      label: "Global",
      color: "hsl(var(--chart-3))",
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
                ? `${company}'s AI Readiness vs ${industry} benchmarks.`
                : `${company}'s AI Readiness vs global benchmarks.`}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {activeChart === "industry"
                ? `Benchmark comparison with ${industry} average`
                : "Benchmark comparison with global average"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-7">
              {/* Interactive Pie Chart */}
              <div className="md:col-span-2">
                <Card data-chart={pieChartId} className="flex flex-col">
                  <ChartStyle id={pieChartId} config={pieChartConfig} />
                  <CardHeader className="flex-row items-start space-y-0 pb-0">
                    <div className="grid gap-1">
                      <CardTitle className="text-lg">
                        AI Readiness Breakdown
                      </CardTitle>
                    </div>
                    <Select
                      value={activeView}
                      onValueChange={(
                        value: "yourScore" | "industry" | "global",
                      ) => {
                        setActiveView(value);
                        if (value !== "yourScore") {
                          setActiveChart(value);
                        }
                      }}
                    >
                      <SelectTrigger
                        className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                        aria-label="Select view"
                      >
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent align="end" className="rounded-xl">
                        <SelectItem value="yourScore" className="rounded-lg">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex h-3 w-3 shrink-0 rounded-sm bg-chart-1" />
                            Your Score
                          </div>
                        </SelectItem>
                        {hasIndustryData && (
                          <SelectItem value="industry" className="rounded-lg">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex h-3 w-3 shrink-0 rounded-sm bg-chart-2" />
                              Industry
                            </div>
                          </SelectItem>
                        )}
                        <SelectItem value="global" className="rounded-lg">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex h-3 w-3 shrink-0 rounded-sm bg-chart-3" />
                            Global
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="flex flex-1 justify-center pb-0">
                    <ChartContainer
                      id={pieChartId}
                      config={pieChartConfig}
                      className="mx-auto aspect-square w-full max-w-[300px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="type"
                          innerRadius={60}
                          strokeWidth={5}
                        >
                          <Label
                            content={({ viewBox }) => {
                              if (
                                viewBox &&
                                "cx" in viewBox &&
                                "cy" in viewBox
                              ) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-foreground text-3xl font-bold"
                                    >
                                      {selectedScore.toFixed(1)}
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-muted-foreground"
                                    >
                                      {activeView === "yourScore" ? "Your Score" : 
                                       activeView === "industry" ? "Industry Avg" : "Global Avg"}
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-5">
                {/* Chart */}
                <ChartContainer config={chartConfig}>
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickMargin={10} fontSize={9} />
                    <YAxis
                      domain={[0, 10]}
                      tickCount={6}
                      fontSize={11}
                      label={{
                        value: "Score (0-10)",
                        angle: -90,
                        position: "insideCenter",
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
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
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {activeChart === "industry"
                ? `Based on ${data.industry} submissions in ${data.quarter}`
                : `Based on global submissions in ${data.quarter}`}
            </p>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
