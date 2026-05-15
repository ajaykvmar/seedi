// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";
import { calculateKeywordScores } from "@/lib/keyword-analysis";
import { SearchResponse } from "@/lib/types";
import { extractKeywordsFromTexts } from "@/lib/keyword-extraction";

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
    const relatedTerms = extractRelatedTerms(results, term.trim());

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
  results: { trackName?: string }[],
  query: string
): string[] {
  // Extract from app titles only — they contain the actual keyword targeting
  const texts: string[] = [];
  for (const r of results) {
    if (r.trackName) texts.push(r.trackName);
  }
  return extractKeywordsFromTexts(texts, query);
}
