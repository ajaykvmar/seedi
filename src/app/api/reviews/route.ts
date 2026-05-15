// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getReviews } from "@/lib/reviews";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "App ID is required" }, { status: 400 });
  }

  const trackId = parseInt(id, 10);
  if (isNaN(trackId)) {
    return NextResponse.json({ error: "Invalid app ID" }, { status: 400 });
  }

  try {
    const summary = await getReviews(trackId);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 502 }
    );
  }
}
