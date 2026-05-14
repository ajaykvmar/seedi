// src/__tests__/keyword-analysis.test.ts
import { describe, it, expect } from "vitest";
import { calculateKeywordScores } from "@/lib/keyword-analysis";
import { AppResult } from "@/lib/types";

function makeApp(overrides: Partial<AppResult> = {}): AppResult {
  return {
    trackId: 1,
    trackName: "Test App",
    description: "",
    averageUserRating: 3.0,
    userRatingCount: 100,
    releaseDate: "2024-01-01T00:00:00Z",
    artworkUrl100: "",
    primaryGenreName: "Utilities",
    genres: ["Utilities"],
    sellerName: "Test Dev",
    price: 0,
    formattedPrice: "Free",
    currency: "USD",
    screenshotUrls: [],
    trackViewUrl: "",
    ...overrides,
  };
}

describe("calculateKeywordScores", () => {
  it("returns zeros for empty results", () => {
    expect(calculateKeywordScores([])).toEqual({ opportunity: 0, difficulty: 0, popularity: 0 });
  });

  it("returns lower difficulty when top apps have low ratings", () => {
    const apps = Array.from({ length: 10 }, (_, i) =>
      makeApp({ trackId: i + 1, trackName: `App ${i}`, averageUserRating: 2.5, userRatingCount: 50 })
    );
    expect(calculateKeywordScores(apps).difficulty).toBeLessThan(50);
  });

  it("returns higher difficulty when top apps have high ratings and many reviews", () => {
    const apps = Array.from({ length: 10 }, (_, i) =>
      makeApp({ trackId: i + 1, averageUserRating: 4.8, userRatingCount: 50000 })
    );
    expect(calculateKeywordScores(apps).difficulty).toBeGreaterThan(50);
  });

  it("returns opportunity inversely correlated with difficulty", () => {
    const easyApps = Array.from({ length: 10 }, (_, i) =>
      makeApp({ trackId: i + 1, averageUserRating: 1.0, userRatingCount: 10 })
    );
    const hardApps = Array.from({ length: 10 }, (_, i) =>
      makeApp({ trackId: i + 1, averageUserRating: 5.0, userRatingCount: 100000 })
    );
    expect(calculateKeywordScores(easyApps).opportunity).toBeGreaterThan(
      calculateKeywordScores(hardApps).opportunity
    );
  });

  it("returns all scores in 0-100 range", () => {
    const apps = Array.from({ length: 25 }, (_, i) => makeApp({ trackId: i + 1 }));
    const scores = calculateKeywordScores(apps);
    expect(scores.opportunity).toBeGreaterThanOrEqual(0);
    expect(scores.opportunity).toBeLessThanOrEqual(100);
    expect(scores.difficulty).toBeGreaterThanOrEqual(0);
    expect(scores.difficulty).toBeLessThanOrEqual(100);
    expect(scores.popularity).toBeGreaterThanOrEqual(0);
    expect(scores.popularity).toBeLessThanOrEqual(100);
  });

  it("gives higher popularity for keywords with more total ratings", () => {
    const lowPop = Array.from({ length: 25 }, (_, i) =>
      makeApp({ trackId: i + 1, userRatingCount: 10 })
    );
    const highPop = Array.from({ length: 25 }, (_, i) =>
      makeApp({ trackId: i + 1, userRatingCount: 50000 })
    );
    expect(calculateKeywordScores(highPop).popularity).toBeGreaterThan(
      calculateKeywordScores(lowPop).popularity
    );
  });
});
