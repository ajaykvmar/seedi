// src/app/api/suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const results = await searchApps(q.trim(), "us", 5);
    const suggestions = results
      .map((r) => r.trackName)
      .filter((name) => name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
