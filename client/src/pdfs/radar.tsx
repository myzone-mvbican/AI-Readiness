import React from "react";
import { Text, View, Svg, Circle, Line, Polygon } from "@react-pdf/renderer";

// PDF Radar Chart Component
export const RadarChart = ({
  data,
  width = 550,
  height = 300,
}: {
  data: Array<{ name: string; score: number; fullMark: number }>;
  width?: number;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>No chart data available</Text>
      </View>
    );
  }

  // Chart configuration
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.8;

  // Calculate points for the polygon (the filled radar area)
  const dataPoints = data
    .map((item, index) => {
      const angle = ((Math.PI * 2) / data.length) * index;
      const normalizedValue = item.score / item.fullMark; // 0-1 scale
      const x = centerX + radius * normalizedValue * Math.sin(angle);
      const y = centerY - radius * normalizedValue * Math.cos(angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Category labels positioning
  const labelPoints = data.map((item, index) => {
    const angle = ((Math.PI * 2) / data.length) * index;
    // Position labels slightly outside the chart area
    const x = centerX + (radius + 15) * Math.sin(angle);
    const y = centerY - (radius + 15) * Math.cos(angle);
    return {
      x,
      y,
      label: item.name,
      align: x > centerX ? "left" : x < centerX ? "right" : "center",
      vAlign: y > centerY ? "top" : "bottom",
    };
  });

  // Generate concentric circles for scale
  const circles = [0.33, 0.66, 1].map((scale) => {
    return {
      r: radius * scale,
      stroke: "#E2E8F0",
      strokeWidth: 0.5,
      strokeDasharray: "2,2",
    };
  });

  return (
    <View style={{ width, height, marginBottom: 25 }}>
      <Svg height={height} width={width}>
        {/* Background grid circles */}
        {circles.map((circle, i) => (
          <Circle
            key={`circle-${i}`}
            cx={centerX}
            cy={centerY}
            r={circle.r}
            stroke={circle.stroke}
            strokeWidth={circle.strokeWidth}
            strokeDasharray={circle.strokeDasharray}
            fill="none"
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = ((Math.PI * 2) / data.length) * i;
          const endX = centerX + radius * Math.sin(angle);
          const endY = centerY - radius * Math.cos(angle);

          return (
            <Line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#E2E8F0"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill="#4361EE"
          fillOpacity={0.3}
          stroke="#4361EE"
          strokeWidth={1.5}
        />

        {/* Data points */}
        {data.map((item, i) => {
          const angle = ((Math.PI * 2) / data.length) * i;
          const normalizedValue = item.score / item.fullMark;
          const x = centerX + radius * normalizedValue * Math.sin(angle);
          const y = centerY - radius * normalizedValue * Math.cos(angle);

          return (
            <Circle key={`point-${i}`} cx={x} cy={y} r={3} fill="#4361EE" />
          );
        })}

        {/* Scale line with numbers */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={centerX + radius}
          y2={centerY}
          stroke="#94A3B8"
          strokeWidth={0.5}
        />
        {[0, 3, 6, 10].map((value) => {
          const x = centerX + (radius * value) / 10;
          return (
            <Text
              key={`scale-${value}`}
              x={x}
              y={centerY + 10}
              textAnchor="middle"
              fill="#64748B"
              style={{ fontSize: 8 }}
            >
              {value}
            </Text>
          );
        })}
      </Svg>

      {/* Category labels */}
      {labelPoints.map((point, i) => (
        <Text
          key={`label-${i}`}
          style={{
            position: "absolute",
            left:
              point.x -
              (point.align === "right" ? 110 : point.align === "left" ? 0 : 55),
            top: point.y - (point.vAlign === "bottom" ? 5 : 5),
            width: 110,
            fontSize: 8,
            // Need to use specific enum values for textAlign in react-pdf
            textAlign: (point.align === "left"
              ? "left"
              : point.align === "right"
                ? "right"
                : "center") as any,
            color: "#121212",
          }}
        >
          {point.label}
        </Text>
      ))}
    </View>
  );
};

export default RadarChart;
