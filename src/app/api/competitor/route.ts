// src/app/api/competitor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchApps, lookupApp } from "@/lib/apple-api";
import { findCategoryKeywords, computeOverlap } from "@/lib/competitor-analysis";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const country = searchParams.get("country") || "us";

  if (!id) {
    return NextResponse.json({ error: "App ID is required" }, { status: 400 });
  }

  const trackId = parseInt(id, 10);
  if (isNaN(trackId)) {
    return NextResponse.json({ error: "Invalid app ID" }, { status: 400 });
  }

  try {
    const app = await lookupApp(trackId, country);
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const genreResults = await searchApps(app.primaryGenreName, country, 25);
    const keywords = findCategoryKeywords(genreResults);

    const nameWords = app.trackName.split(/\s+/).slice(0, 2).join(" ");
    const competitorResults = await searchApps(nameWords, country, 10);

    const competitors = competitorResults
      .filter((c) => c.trackId !== app.trackId)
      .slice(0, 5)
      .map((comp) => {
        const compKeywords = findCategoryKeywords([comp]);
        const overlap = computeOverlap(keywords, compKeywords);
        return { app: comp, overlap };
      });

    return NextResponse.json(
      { app, keywords, competitors, category: app.primaryGenreName },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze competitors" },
      { status: 502 }
    );
  }
}
