import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
import { Pie, PieChart, Cell, Sector } from "recharts";

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

interface AssessmentCompareProps {
  assessmentId: number;
}

export default function AssessmentCompare({ assessmentId }: AssessmentCompareProps) {
  const { user } = useAuth();
  const [activeChart, setActiveChart] = useState<"industry" | "global">("global");
  const [activeView, setActiveView] = useState<"industry" | "global">("global");

  const {
    data: benchmarkData,
    isLoading,
    error,
  } = useQuery<{
    success: boolean;
    data: BenchmarkData;
  }>({
    queryKey: [`/api/assessments/${assessmentId}/benchmark`],
    enabled: !!assessmentId,
  });

  // Auto-select Global when user's industry has no data (must be before conditional returns)
  useEffect(() => {
    if (benchmarkData?.data && !benchmarkData.data.categories.some(c => c.industryAverage !== null) && activeChart === "industry") {
      setActiveChart("global");
      setActiveView("global");
    }
  }, [benchmarkData, activeChart]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  if (error || !benchmarkData?.success || !benchmarkData?.data) {
    return (
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
    );
  }

  const { data } = benchmarkData;
  const { company = "Your company", industry = "Industry" } = user || {};

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

  // Prepare data for bar chart
  const chartData = data.categories.map((category) => ({
    name: category.name,
    userScore: Number(category.userScore.toFixed(1)),
    benchmark:
      activeChart === "industry" && category.industryAverage !== null
        ? Number(category.industryAverage.toFixed(1))
        : Number((category.globalAverage || 0).toFixed(1)),
  }));

  // Calculate totals for pie chart
  const userTotal = Number(avgUserScore.toFixed(1));
  const industryTotal = avgIndustryScore ? Number(avgIndustryScore.toFixed(1)) : null;
  const globalTotal = Number(avgGlobalScore.toFixed(1));

  // Prepare data for pie chart
  const pieData = [
    {
      type: "company",
      value: userTotal,
      fill: "hsl(var(--chart-1))",
    },
    ...(hasIndustryData && industryTotal
      ? [
          {
            type: "industry",
            value: industryTotal,
            fill: "hsl(var(--chart-2))",
          },
        ]
      : []),
    {
      type: "global",
      value: globalTotal,
      fill: "hsl(var(--chart-3))",
    },
  ];

  const pieChartId = "pie-interactive";

  // Get the selected score for pie chart center
  let selectedScore = userTotal;
  if (activeView === "industry" && industryTotal) {
    selectedScore = industryTotal;
  } else if (activeView === "global") {
    selectedScore = globalTotal;
  }

  // Chart configuration
  const chartConfig = {
    userScore: {
      label: `${company} score`,
      color: "hsl(var(--chart-1))",
    },
    benchmark: {
      label: (
        <span className="capitalize">
          {activeChart === "industry"
            ? `${industry} average`
            : "Global average"}
        </span>
      ),
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
      label: <span className="capitalize">{industry}</span>,
      color: "hsl(var(--chart-2))",
    },
    global: {
      label: "Global",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 space-y-3">
        <div className="col-span-1">
          <div className="col-span-1 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-foreground" />
            <h2 className="text-xl text-foreground font-semibold">
              Benchmark Comparison
            </h2>
          </div>
          <p className="text-muted-foreground mt-2">
            {activeChart === "industry"
              ? `${company}'s AI Readiness vs ${industry} benchmarks.`
              : `${company}'s AI Readiness vs global benchmarks.`}
          </p>
        </div>
      </div>
      <p className="text-sm lg:text-lg font-medium">
        {activeChart === "industry"
          ? `Benchmark comparison with ${industry} average`
          : "Benchmark comparison with global average"}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Interactive Pie Chart */}
        <div className="lg:col-span-2">
          <Card data-chart={pieChartId} className="flex flex-col">
            <ChartStyle id={pieChartId} config={pieChartConfig} />
            <CardHeader className="flex-row items-start space-y-0">
              <div className="grid gap-1">
                <CardTitle className="text-sm lg:text-lg">
                  Compare against:
                </CardTitle>
              </div>
              <Select
                value={activeView}
                onValueChange={(value: "industry" | "global") => {
                  setActiveView(value);
                  setActiveChart(value);
                }}
              >
                <SelectTrigger
                  className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                  aria-label="Select view"
                >
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-xl">
                  <SelectItem 
                    value="industry" 
                    className="rounded-lg" 
                    disabled={!hasIndustryData}
                  >
                    <div className="flex items-center gap-2 text-xs capitalize">
                      <span className={`flex h-3 w-3 shrink-0 rounded-sm ${hasIndustryData ? 'bg-chart-2' : 'bg-muted'}`} />
                      {industry}
                      {!hasIndustryData && (
                        <span className="text-xs text-muted-foreground ml-1">(No data)</span>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="global" className="rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex h-3 w-3 shrink-0 rounded-sm bg-chart-3" />
                      Global
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-5 border-t border-border">
              {/* Performance Indicator */}
              <div className="mx-auto aspect-square w-full max-w-[250px]">
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square w-full max-w-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="type"
                      innerRadius={60}
                      strokeWidth={5}
                      activeIndex={
                        activeView === "industry" && hasIndustryData ? 1 : 
                        activeView === "global" ? (hasIndustryData ? 2 : 1) : 0
                      }
                      activeShape={({
                        outerRadius = 0,
                        ...props
                      }: any) => (
                        <Sector {...props} outerRadius={outerRadius + 10} />
                      )}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        className="fill-background"
                        stroke="none"
                        fontSize={12}
                        formatter={(value: keyof typeof pieChartConfig) =>
                          pieChartConfig[value as keyof typeof pieChartConfig]?.label
                        }
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="text-center mt-4">
                <div className="text-2xl font-bold">{selectedScore}</div>
                <div className="text-sm text-muted-foreground">
                  {activeView === "industry"
                    ? `${industry} Average`
                    : "Global Average"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Comparison Chart */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                Compare your scores across different AI readiness categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  layout="vertical"
                  margin={{
                    right: 16,
                  }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <XAxis dataKey="userScore" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="userScore"
                    layout="horizontal"
                    fill="var(--color-userScore)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      className="fill-[--color-label]"
                      fontSize={12}
                    />
                    <LabelList
                      dataKey="userScore"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                  <Bar
                    dataKey="benchmark"
                    layout="horizontal"
                    fill="var(--color-benchmark)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="benchmark"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTotal}/10</div>
            <p className="text-xs text-muted-foreground">
              Based on {data.categories.length} categories
            </p>
          </CardContent>
        </Card>

        {hasIndustryData && industryTotal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {industry} Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{industryTotal}/10</div>
              <p className="text-xs text-muted-foreground">
                Industry benchmark
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Global Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalTotal}/10</div>
            <p className="text-xs text-muted-foreground">
              Based on global submissions in {data.quarter}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}