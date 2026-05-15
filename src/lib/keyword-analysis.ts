// src/lib/keyword-analysis.ts
// ASO keyword scoring — revised with honest signal limits.
//
// What the public API CAN tell us:
//   - What apps rank for a keyword (search results)
//   - Their names, ratings, rating counts, release dates
//   - Their genres and descriptions
//
// What it CANNOT tell us:
//   - The keyword field (100 char hidden field — biggest ranking factor)
//   - Per-keyword download volume
//   - Apple Search Ads spend
//   - Engagement / retention
//
// So we focus on what's measurable:
//   POPULARITY  — search demand proxy (ratings volume)
//   DIFFICULTY  — how optimized/saturated the top results are
//   OPPORTUNITY — mismatch between demand and title targeting

import { AppResult, KeywordScores } from "./types";

export function calculateKeywordScores(results: AppResult[]): KeywordScores {
  if (results.length === 0) {
    return { opportunity: 0, difficulty: 0, popularity: 0 };
  }

  const top10 = results.slice(0, 10);
  const top25 = results.slice(0, 25);
  const totalResults = results.length;

  // ── POPULARITY (Search Demand) ─────────────────────────────────────
  // More total ratings across all results = bigger audience.
  // More results = more apps optimizing for this keyword.
  //
  // LIMITATION: ratings reflect lifetime downloads, not current search volume.
  // An old keyword with many downloads could have low current search volume.

  const totalRatings = sum(results.map((a) => a.userRatingCount));
  const demandScore = Math.min(Math.round((Math.log10(totalRatings + 1) / 7) * 80), 80);
  const breadthBonus = Math.min(Math.round((totalResults / 50) * 20), 20);
  const popularity = Math.min(demandScore + breadthBonus, 100);

  // ── DIFFICULTY ─────────────────────────────────────────────────────
  // Not "how many ratings you need" but "how optimized is the top 10."

  // 1. Title density (40%): what % of top 10 have keyword words in title?
  // This is the KEY signal — title match is the #1 ranking factor we can observe.
  const queryWords = getMeaningfulQueryWords(results);
  const titleMatchCount = top10.filter((a) => {
    const name = a.trackName.toLowerCase();
    return queryWords.some((w) => w.length >= 3 && name.includes(w));
  }).length;
  // 0/10 = low saturation = easier. 10/10 = saturated = harder.
  const titleDensity = Math.round((titleMatchCount / 10) * 40);

  // 2. Rating power (30%): average rating count of top 10, log-scaled.
  // Not a direct ranking factor, but correlated with app quality and brand strength.
  const top10AvgRatings = average(top10.map((a) => a.userRatingCount));
  const ratingPower = Math.min(Math.round((Math.log10(top10AvgRatings + 1) / 6) * 30), 30);

  // 3. Freshness barrier (30%): how old is the newest app in top 10?
  // If even the newest top-10 app is 5 years old, the market is stagnant.
  const newestInTop10 = Math.max(...top10.map((a) => new Date(a.releaseDate).getTime()));
  const newestAge = Date.now() - newestInTop10;
  const newestAgeYears = newestAge / (365 * 24 * 60 * 60 * 1000);
  // <1 year → 0 pts (fresh, fluid), 5+ years → 30 pts (stagnant, locked)
  const freshnessBarrier = Math.min(Math.round((newestAgeYears / 5) * 30), 30);

  // 4. Description density (bonus difficulty signal) — 15% weight
  // If apps don't have keyword in title BUT have it in description,
  // they still compete. This catches keyword-stuffed descriptions.
  const descMatchCount = top10.filter((a) => {
    if (!a.description) return false;
    const desc = a.description.toLowerCase();
    return queryWords.some((w) => w.length >= 3 && desc.includes(w));
  }).length;
  const descDensity = Math.round((descMatchCount / 10) * 15);

  const difficulty = Math.min(titleDensity + ratingPower + freshnessBarrier + descDensity, 100);

  // ── OPPORTUNITY ─────────────────────────────────────────────────────
  // Where's the mismatch between demand and supply?
  //
  // Best opportunity signal: HIGH popularity + LOW title density
  // (People search for it, but few apps target it in their title)
  //
  // Secondary: FRESH apps ranking (algorithm is fluid)
  // Tertiary: LARGE rating gap between #1 and #10 (you don't need to beat #1)

  // Signal 1: Title gap (0-40 points)
  // The strongest opportunity signal we can measure.
  // If only 2/10 apps have the keyword in their name, you can claim it.
  const notTargeting = 10 - titleMatchCount;
  const titleGapScore = Math.round((notTargeting / 10) * 40);

  // Signal 2: Freshness score (0-30 points)
  // What % of top 25 released in last 2 years?
  const freshApps = top25.filter((a) => {
    const age = Date.now() - new Date(a.releaseDate).getTime();
    return age < 2 * 365 * 24 * 60 * 60 * 1000;
  }).length;
  const freshRatio = freshApps / Math.min(top25.length, 1);
  const freshnessScore = Math.min(Math.round(freshRatio * 30), 30);

  // Signal 3: Ranking gap (0-20 points)
  // If #1 has 500K ratings and #10 has 500, that's a real gap.
  // But this is a WEAK signal — #10 might have 500 because it targets a different keyword.
  const first = top10[0];
  const tenth = top10[top10.length - 1];
  const firstCount = first?.userRatingCount ?? 0;
  const tenthCount = tenth?.userRatingCount ?? 0;
  let gapScore = 0;
  if (tenthCount > 0 && firstCount > tenthCount * 10) {
    gapScore = 10; // moderate gap
  }
  if (tenthCount > 0 && firstCount > tenthCount * 50) {
    gapScore = 20; // large gap
  }

  // Signal 4: Demand factor (multiplier 0-1)
  const demandFactor = popularity / 100;

  // Composite: additive signals × demand
  const rawOpp = Math.round((titleGapScore + freshnessScore + gapScore) * (0.5 + demandFactor * 0.5));

  const opportunity = Math.min(rawOpp, 100);

  return {
    popularity,
    difficulty,
    opportunity,
  };
}

function getMeaningfulQueryWords(results: AppResult[]): string[] {
  if (results.length === 0) return [];
  const name = results[0].trackName.toLowerCase();
  return name.split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "app", "apps", "free",
  "pro", "plus", "new", "best", "top", "my", "your", "our", "its",
]);

function average(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
