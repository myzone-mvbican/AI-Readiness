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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Compare against selector and Pie Chart */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Compare against:</span>
            <Select
              value={activeView}
              onValueChange={(value: "industry" | "global") => {
                setActiveView(value);
                setActiveChart(value);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value="industry" 
                  disabled={!hasIndustryData}
                >
                  <span className="capitalize">
                    {industry}
                    {!hasIndustryData && " (No data)"}
                  </span>
                </SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center">
            <div className="w-64 h-64">
              <ChartContainer
                config={pieChartConfig}
                className="w-full h-full"
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
                    outerRadius={120}
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold">{selectedScore}</div>
              <div className="text-sm text-muted-foreground">
                {activeView === "industry" && hasIndustryData
                  ? `${industry} Average`
                  : "Global Average"}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Category Breakdown */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Category Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Compare your scores across different AI readiness categories
            </p>
          </div>
          
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 20,
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
                tickFormatter={(value: string) => value.slice(0, 20)}
                width={150}
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