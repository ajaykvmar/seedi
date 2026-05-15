// src/app/api/developer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { lookupDeveloper } from "@/lib/apple-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const country = searchParams.get("country") || "us";

  if (!id) {
    return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });
  }

  const artistId = parseInt(id, 10);
  if (isNaN(artistId)) {
    return NextResponse.json({ error: "Invalid artist ID" }, { status: 400 });
  }

  try {
    const apps = await lookupDeveloper(artistId, country);
    return NextResponse.json(
      { apps, artistId, total: apps.length },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Developer lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer apps" },
      { status: 502 }
    );
  }
}
