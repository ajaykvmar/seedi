// src/app/api/app-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { lookupApp } from "@/lib/apple-api";

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

    return NextResponse.json(app, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("App info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app info" },
      { status: 502 }
    );
  }
}
