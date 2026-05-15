// src/lib/competitor-analysis.ts
import { AppResult } from "./types";
import { extractKeywordsFromTexts } from "./keyword-extraction";

export function findCategoryKeywords(apps: AppResult[]): string[] {
  // Extract keywords from app titles only — they carry the most keyword weight
  const texts: string[] = apps.map((app) => app.trackName);
  return extractKeywordsFromTexts(texts);
}

export interface OverlapResult {
  overlapCount: number;
  overlapPercentage: number;
  shared: string[];
}

export function computeOverlap(
  targetKeywords: string[],
  competitorKeywords: string[]
): OverlapResult {
  const targetSet = new Set(targetKeywords.map((k) => k.toLowerCase()));
  const competitorSet = new Set(competitorKeywords.map((k) => k.toLowerCase()));

  const shared: string[] = [];
  for (const kw of targetSet) {
    if (competitorSet.has(kw)) {
      shared.push(kw);
    }
  }

  const overlapCount = shared.length;
  const overlapPercentage =
    targetKeywords.length > 0
      ? Math.round((overlapCount / targetKeywords.length) * 100)
      : 0;

  return { overlapCount, overlapPercentage, shared };
}
