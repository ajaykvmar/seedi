// src/components/keyword-scores.tsx
"use client";

import { KeywordScores as KeywordScoresType } from "@/lib/types";

interface ScoreBadgeProps {
  label: string;
  value: number;
  high: boolean;
}

function ScoreBadge({ label, value, high }: ScoreBadgeProps) {
  return (
    <div className={`border-2 p-3 ${high ? "bg-black text-white border-black" : "border-black"}`}>
      <span className="text-2xl font-bold tabular-nums block">{value}</span>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

function getHigh(value: number, label: string): boolean {
  if (label === "Difficulty") return value <= 33;
  return value >= 66;
}

interface Props {
  scores: KeywordScoresType;
}

export function KeywordScores({ scores }: Props) {
  return (
    <div className="flex gap-2">
      <ScoreBadge label="Opportunity" value={scores.opportunity} high={getHigh(scores.opportunity, "Opportunity")} />
      <ScoreBadge label="Difficulty" value={scores.difficulty} high={getHigh(scores.difficulty, "Difficulty")} />
      <ScoreBadge label="Popularity" value={scores.popularity} high={getHigh(scores.popularity, "Popularity")} />
    </div>
  );
}
