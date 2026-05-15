import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";
import { calculateKeywordScores } from "@/lib/keyword-analysis";

const DEFAULT_COUNTRIES = [
  // English-speaking wealthy markets
  "us", "ca", "gb", "au", "ie", "nz",
  // Western / Central Europe
  "de", "fr", "nl", "be", "lu", "at",
  // Nordics + Switzerland
  "ch", "se", "no", "dk", "fi", "is",
  // Southern Europe
  "it", "es", "cy", "mt",
  // East Asia wealthy
  "jp", "kr", "sg", "hk", "tw",
  // Middle East wealthy
  "ae", "il", "qa", "kw",
  // Upper-middle income (large mobile markets, lower per capita)
  "br", "mx", "tr", "ru", "pl",
  // Lower-income (huge mobile-first audiences)
  "in", "za",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const term = searchParams.get("q");
  const countriesParam = searchParams.get("countries");
  const countries = countriesParam
    ? countriesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : DEFAULT_COUNTRIES;

  if (!term || term.trim().length < 2) {
    return NextResponse.json({ error: "Query required (min 2 chars)" }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      countries.map(async (country) => {
        try {
          const apps = await searchApps(term.trim(), country, 25);
          const scores = calculateKeywordScores(apps);
          const totalResults = apps.length;
          const topName = apps[0]?.trackName ?? null;
          const targetScore = Math.round(
            scores.opportunity * 0.5
            + (100 - scores.difficulty) * 0.25
            + scores.popularity * 0.25
          );
          return {
            country,
            scores,
            targetScore,
            totalResults,
            topApp: topName,
            topRatingCount: apps[0]?.userRatingCount ?? 0,
          };
        } catch {
          return {
            country,
            scores: { popularity: 0, difficulty: 0, opportunity: 0 },
            targetScore: 0,
            totalResults: 0,
            topApp: null,
            topRatingCount: 0,
            error: "Failed",
          };
        }
      })
    );

    // Sort: best markets first
    results.sort((a, b) => (b.targetScore ?? 0) - (a.targetScore ?? 0));

    return NextResponse.json({
      query: term.trim(),
      results,
    });
  } catch (error) {
    console.error("Multi-country error:", error);
    return NextResponse.json({ error: "Multi-country analysis failed" }, { status: 502 });
  }
}
