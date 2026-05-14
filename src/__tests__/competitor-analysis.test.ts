// src/__tests__/competitor-analysis.test.ts
import { describe, it, expect } from "vitest";
import { findCategoryKeywords, computeOverlap } from "@/lib/competitor-analysis";
import { AppResult } from "@/lib/types";

function makeApp(overrides: Partial<AppResult> = {}): AppResult {
  return {
    trackId: 1,
    trackName: "Test",
    primaryGenreName: "Health & Fitness",
    genres: ["Health & Fitness"],
    sellerName: "Dev",
    averageUserRating: 4.0,
    userRatingCount: 1000,
    releaseDate: "2024-01-01T00:00:00Z",
    artworkUrl100: "",
    price: 0,
    formattedPrice: "Free",
    currency: "USD",
    screenshotUrls: [],
    trackViewUrl: "",
    ...overrides,
  };
}

describe("findCategoryKeywords", () => {
  it("returns empty array for empty input", () => {
    expect(findCategoryKeywords([])).toEqual([]);
  });

  it("extracts unique genre-based keywords", () => {
    const apps = [
      makeApp({ trackId: 1, trackName: "Fitness Pro" }),
      makeApp({ trackId: 2, trackName: "Health Tracker" }),
    ];
    const keywords = findCategoryKeywords(apps);
    expect(keywords.length).toBeGreaterThan(0);
    expect(new Set(keywords).size).toBe(keywords.length);
  });
});

describe("computeOverlap", () => {
  it("returns zero overlap for completely different keywords", () => {
    const result = computeOverlap(["fitness", "workout"], ["gaming", "racing"]);
    expect(result.overlapCount).toBe(0);
    expect(result.overlapPercentage).toBe(0);
  });

  it("returns full overlap for identical keywords", () => {
    const result = computeOverlap(["fitness", "workout"], ["fitness", "workout"]);
    expect(result.overlapCount).toBe(2);
    expect(result.overlapPercentage).toBe(100);
  });

  it("returns partial overlap correctly", () => {
    const result = computeOverlap(["fitness", "workout", "yoga", "running"], ["fitness", "yoga", "meditation"]);
    expect(result.overlapCount).toBe(2);
    expect(result.overlapPercentage).toBe(50);
  });
});
