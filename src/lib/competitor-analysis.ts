// src/lib/competitor-analysis.ts
import { AppResult } from "./types";

const SEED_KEYWORDS = [
  "fitness", "workout", "health", "tracker", "meditation", "yoga",
  "running", "nutrition", "diet", "exercise", "gym", "wellness",
  "sleep", "mindfulness", "weight", "calories", "steps", "heart",
  "training", "coach", "planner", "habit", "journal", "mood",
  "social", "photo", "editor", "video", "music", "game",
  "productivity", "notes", "calendar", "tasks", "finance", "budget",
];

export function findCategoryKeywords(apps: AppResult[]): string[] {
  const keywords = new Set<string>();

  for (const app of apps) {
    for (const genre of app.genres) {
      keywords.add(genre.toLowerCase());
    }
    const nameWords = app.trackName.toLowerCase().split(/\s+/);
    for (const word of nameWords) {
      if (SEED_KEYWORDS.includes(word)) {
        keywords.add(word);
      }
    }
  }

  return [...keywords];
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
