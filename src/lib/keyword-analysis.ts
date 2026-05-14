// src/lib/keyword-analysis.ts
import { AppResult, KeywordScores } from "./types";

export function calculateKeywordScores(results: AppResult[]): KeywordScores {
  if (results.length === 0) {
    return { opportunity: 0, difficulty: 0, popularity: 0 };
  }

  const top10 = results.slice(0, 10);
  const top25 = results.slice(0, 25);

  const avgRating = average(top10.map((a) => a.averageUserRating));
  const totalRatings = sum(top10.map((a) => a.userRatingCount));

  const ratingFactor = Math.min(avgRating / 5, 1) * 30;
  const ratingsFactor = Math.min(Math.log10(totalRatings + 1) / 7, 1) * 25;
  const saturationFactor =
    Math.min(
      top10.filter((a) =>
        a.trackName.toLowerCase().includes(results[0]?.trackName.toLowerCase() ?? "")
      ).length / 5,
      1
    ) * 25;
  const bigPlayerFactor =
    Math.min(
      top10.filter((a) => a.userRatingCount > 100000).length / 5,
      1
    ) * 20;

  const difficulty = Math.round(
    ratingFactor + ratingsFactor + saturationFactor + bigPlayerFactor
  );

  const freshApps = top25.filter((a) => {
    const age = Date.now() - new Date(a.releaseDate).getTime();
    return age < 365 * 24 * 60 * 60 * 1000;
  }).length;
  const freshnessBonus = Math.min(freshApps * 5, 20);
  const opportunity = Math.max(Math.round(100 - difficulty + freshnessBonus), 0);

  const logRatings = Math.log10(sum(results.map((a) => a.userRatingCount)) + 1);
  const popularity = Math.min(Math.round((logRatings / 7) * 100), 100);

  return {
    opportunity: Math.min(opportunity, 100),
    difficulty: Math.min(difficulty, 100),
    popularity: Math.min(popularity, 100),
  };
}

function average(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
