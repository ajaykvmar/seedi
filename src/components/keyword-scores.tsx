// src/components/keyword-scores.tsx
"use client";

import { KeywordScores as KeywordScoresType } from "@/lib/types";

interface ScoreBadgeProps {
  label: string;
  value: number;
  color: "green" | "yellow" | "red";
}

function ScoreBadge({ label, value, color }: ScoreBadgeProps) {
  const colorClasses = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border ${colorClasses[color]}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium mt-0.5">{label}</span>
    </div>
  );
}

function getColor(value: number): "green" | "yellow" | "red" {
  if (value >= 66) return "green";
  if (value >= 33) return "yellow";
  return "red";
}

function getDifficultyColor(value: number): "green" | "yellow" | "red" {
  if (value <= 33) return "green";
  if (value <= 66) return "yellow";
  return "red";
}

interface Props {
  scores: KeywordScoresType;
}

export function KeywordScores({ scores }: Props) {
  return (
    <div className="flex gap-3">
      <ScoreBadge label="Opportunity" value={scores.opportunity} color={getColor(scores.opportunity)} />
      <ScoreBadge label="Difficulty" value={scores.difficulty} color={getDifficultyColor(scores.difficulty)} />
      <ScoreBadge label="Popularity" value={scores.popularity} color={getColor(scores.popularity)} />
    </div>
  );
}
