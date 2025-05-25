import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { Survey, Assessment } from "@shared/types";
import { getRadarChartData } from "@/lib/utils";

interface ScreenResultsData {
  assessment: Assessment & { survey?: Survey };
}

export default function ScreenResults({ assessment }: ScreenResultsData) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-x-3">
          <span>AI Readiness Score: {(assessment.score ?? 0) / 10}/10</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="p-2">
              This score represents your organization's current AI readiness
              level.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>
          Based on your responses, your organization is at the
          {(assessment.score ?? 0) >= 80
            ? " advanced "
            : (assessment.score ?? 0) >= 60
              ? " intermediate "
              : (assessment.score ?? 0) >= 40
                ? " developing "
                : " beginning "}
          stage of AI readiness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            // Config for the score data point
            score: {
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[calc(100dvh-480px)] w-full"
        >
          <RadarChart outerRadius="80%" data={getRadarChartData(assessment)}>
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
                          <span className="font-bold">{data.payload.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Score
                          </span>
                          <span className="font-bold">{data.value}/10</span>
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
      </CardContent>
    </Card>
  );
}
