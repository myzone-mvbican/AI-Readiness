import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip as RechartsTooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Survey, Assessment } from "@shared/types";
import { getRadarChartData } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const CategoriesRadarChart = ({
    assessment,
    ...props
}: {
    assessment: Assessment & { survey?: Survey };
}) => {
    const isMobile = useIsMobile();
    
    return (
        <ChartContainer
            config={{
                // Config for the score data point
                score: {
                    color: "hsl(var(--primary))",
                },
            }}
            className="h-[calc(100dvh-480px)] w-full"
            {...props}
        >
            <RadarChart outerRadius="80%" data={getRadarChartData(assessment)}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                        fill: "hsl(var(--foreground))",
                        fontSize: isMobile ? 8 : 12,
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
                                            <span className="text-[8px] md:text-[0.70rem] uppercase text-muted-foreground">
                                                Category
                                            </span>
                                            <span className="text-[8px] md:text-[0.70rem] font-bold">
                                                {data.payload.name}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[0.70rem] uppercase text-muted-foreground">
                                                Score
                                            </span>
                                            <span className="text-[8px] md:text-[0.70rem] font-bold">
                                                {data.value}/10
                                            </span>
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
    );
};

export default CategoriesRadarChart;
