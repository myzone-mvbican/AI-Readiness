import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Building2 } from "lucide-react";

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

export function BenchmarkWidget({ assessmentId, className }: BenchmarkWidgetProps) {
  const { data: benchmarkData, isLoading, error } = useQuery<{
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
            <div className="animate-pulse text-muted-foreground">Loading benchmark data...</div>
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
              <p className="text-sm mt-2">Complete more assessments to see industry comparisons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data } = benchmarkData;
  
  // Prepare chart data
  const chartData = data.categories.map(category => ({
    name: category.name,
    "Your Score": Math.round(category.userScore * 100) / 100,
    "Industry Average": category.industryAverage ? Math.round(category.industryAverage * 100) / 100 : null,
    "Global Average": category.globalAverage ? Math.round(category.globalAverage * 100) / 100 : null,
  }));

  // Calculate statistics
  const hasIndustryData = data.categories.some(c => c.industryAverage !== null);
  const avgUserScore = data.categories.reduce((sum, c) => sum + c.userScore, 0) / data.categories.length;
  const avgIndustryScore = hasIndustryData 
    ? data.categories
        .filter(c => c.industryAverage !== null)
        .reduce((sum, c) => sum + (c.industryAverage || 0), 0) / 
      data.categories.filter(c => c.industryAverage !== null).length
    : null;

  const performanceIndicator = avgIndustryScore 
    ? avgUserScore > avgIndustryScore ? "above" : "below"
    : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your AI Readiness vs Industry Benchmarks
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {data.industry}
          </Badge>
          <Badge variant="outline">
            {data.quarter}
          </Badge>
          {performanceIndicator && (
            <Badge 
              variant={performanceIndicator === "above" ? "default" : "secondary"}
              className={performanceIndicator === "above" ? "bg-green-100 text-green-800 border-green-200" : ""}
            >
              {performanceIndicator === "above" ? "Above Industry" : "Below Industry"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={12}
              />
              <YAxis 
                domain={[0, 5]}
                tickCount={6}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: string) => [
                  `${value}/5.0`,
                  name
                ]}
              />
              <Legend />
              <Bar 
                dataKey="Your Score" 
                fill="hsl(var(--primary))" 
                radius={[2, 2, 0, 0]}
                maxBarSize={60}
              />
              {hasIndustryData && (
                <Bar 
                  dataKey="Industry Average" 
                  fill="hsl(var(--muted-foreground))" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={60}
                  opacity={0.7}
                />
              )}
              <Bar 
                dataKey="Global Average" 
                fill="hsl(var(--secondary))" 
                radius={[2, 2, 0, 0]}
                maxBarSize={60}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">
                {Math.round(avgUserScore * 100) / 100}/5.0
              </div>
              <div className="text-muted-foreground">Your Average</div>
            </div>
            {avgIndustryScore && (
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {Math.round(avgIndustryScore * 100) / 100}/5.0
                </div>
                <div className="text-muted-foreground">Industry Average</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {hasIndustryData 
                  ? `Based on ${data.industry} submissions in ${data.quarter}`
                  : "Using global benchmarks (insufficient industry data)"
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}