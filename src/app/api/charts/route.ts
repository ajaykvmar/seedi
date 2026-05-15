// src/app/api/charts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getChart, type FeedType } from "@/lib/charts";

const VALID_FEEDS: FeedType[] = ["top-free", "top-paid"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get("country") || "us";
  const feed = (searchParams.get("feed") || "top-free") as FeedType;
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  if (!VALID_FEEDS.includes(feed)) {
    return NextResponse.json(
      { error: `Invalid feed type. Use: ${VALID_FEEDS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const chart = await getChart(country, feed, limit);
    return NextResponse.json(chart, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Charts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 502 }
    );
  }
}
