import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";
import { calculateKeywordScores } from "@/lib/keyword-analysis";

const DEFAULT_COUNTRIES = [
  "us", "gb", "ca", "au", "in",   // EN-first markets
  "de", "fr", "es", "it", "nl",   // Western Europe
  "jp", "kr", "sg",               // East Asia + SEA hub
  "br", "mx",                     // Latin America
  "ru", "tr", "pl",               // Eastern Europe / Eurasia
  "se", "no", "dk", "ch",         // Nordics + Switzerland
  "ae", "za", "il",               // ME / Africa
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
          return {
            country,
            scores,
            totalResults,
            topApp: topName,
            topRatingCount: apps[0]?.userRatingCount ?? 0,
          };
        } catch {
          return {
            country,
            scores: { popularity: 0, difficulty: 0, opportunity: 0 },
            totalResults: 0,
            topApp: null,
            topRatingCount: 0,
            error: "Failed",
          };
        }
      })
    );

    return NextResponse.json({
      query: term.trim(),
      results,
    });
  } catch (error) {
    console.error("Multi-country error:", error);
    return NextResponse.json({ error: "Multi-country analysis failed" }, { status: 502 });
  }
}
