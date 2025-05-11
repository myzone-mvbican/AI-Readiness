import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

interface RadialChartProps {
  score: number;
}

export function RadialChart({ score }: RadialChartProps) {
  // Sample data for radar chart
  const data = [
    { category: 'Strategy', value: score, fullMark: 100 },
    { category: 'Data', value: score - 10, fullMark: 100 },
    { category: 'Technology', value: score - 5, fullMark: 100 },
    { category: 'People', value: score + 5, fullMark: 100 },
    { category: 'Process', value: score - 15, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Radar
            name="AI Readiness"
            dataKey="value"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.5}
          />
          <RechartsTooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}