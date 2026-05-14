// src/components/rank-history-chart.tsx
"use client";

import { RankSnapshot } from "@/lib/tracker";

interface RankHistoryChartProps {
  history: RankSnapshot[];
  width?: number;
  height?: number;
}

export function RankHistoryChart({
  history,
  width = 80,
  height = 28,
}: RankHistoryChartProps) {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.date - b.date);
  const values = sorted.map((s) => s.rank ?? 25);
  const maxRank = 25;
  const minRank = 1;

  const padding = 1;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = values
    .map((val, i) => {
      const x = padding + (i / Math.max(values.length - 1, 1)) * chartW;
      const y = padding + ((maxRank - val) / (maxRank - minRank)) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const current = values[values.length - 1];
  const trend = current <= 5 ? "text-green-600" : current <= 15 ? "text-yellow-600" : "text-red-600";

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={trend}
      />
    </svg>
  );
}
