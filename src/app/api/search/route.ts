// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";
import { calculateKeywordScores } from "@/lib/keyword-analysis";
import { SearchResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const term = searchParams.get("q");
  const country = searchParams.get("country") || "us";
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  if (!term || term.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const results = await searchApps(term.trim(), country, Math.min(limit, 50));
    const scores = calculateKeywordScores(results);
    const relatedTerms = extractRelatedTerms(results, term);

    const response: SearchResponse = {
      results,
      scores,
      relatedTerms,
      query: term.trim(),
      country,
      total: results.length,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search App Store" },
      { status: 502 }
    );
  }
}

function extractRelatedTerms(
  results: { genres?: string[] }[],
  query: string
): string[] {
  const terms = results
    .flatMap((r) => r.genres ?? [])
    .filter((g) => g.toLowerCase() !== query.toLowerCase());
  return [...new Set(terms)].slice(0, 20);
}
