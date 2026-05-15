import { NextRequest, NextResponse } from "next/server";
import { lookupApp, searchApps } from "@/lib/apple-api";
import { findCategoryKeywords, computeOverlap } from "@/lib/competitor-analysis";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const appId = searchParams.get("app");
  const competitorId = searchParams.get("competitor");
  const country = searchParams.get("country") || "us";

  if (!appId || !competitorId) {
    return NextResponse.json(
      { error: "Both app= and competitor= (trackId) are required" },
      { status: 400 }
    );
  }

  const appTrackId = parseInt(appId, 10);
  const compTrackId = parseInt(competitorId, 10);
  if (isNaN(appTrackId) || isNaN(compTrackId)) {
    return NextResponse.json({ error: "Invalid trackId" }, { status: 400 });
  }

  try {
    const [app, competitor] = await Promise.all([
      lookupApp(appTrackId, country),
      lookupApp(compTrackId, country),
    ]);

    if (!app || !competitor) {
      return NextResponse.json(
        { error: `App not found: ${!app ? "app" : "competitor"}` },
        { status: 404 }
      );
    }

    // Search each app's name to see what keywords they rank for
    const appNameWords = app.trackName.split(/\s+/).slice(0, 3).join(" ");
    const compNameWords = competitor.trackName.split(/\s+/).slice(0, 3).join(" ");

    const [appResults, compResults] = await Promise.all([
      searchApps(appNameWords, country, 25),
      searchApps(compNameWords, country, 25),
    ]);

    const appKeywords = findCategoryKeywords(appResults);
    const compKeywords = findCategoryKeywords(compResults);

    const overlap = computeOverlap(appKeywords, compKeywords);

    // Find keywords only in app, only in competitor
    const appSet = new Set(appKeywords.map((k) => k.toLowerCase()));
    const compSet = new Set(compKeywords.map((k) => k.toLowerCase()));

    const onlyApp = appKeywords.filter((k) => !compSet.has(k.toLowerCase()));
    const onlyComp = compKeywords.filter((k) => !appSet.has(k.toLowerCase()));

    return NextResponse.json({
      app: { trackId: app.trackId, trackName: app.trackName },
      competitor: { trackId: competitor.trackId, trackName: competitor.trackName },
      overlap,
      onlyApp: onlyApp.slice(0, 15),
      onlyComp: onlyComp.slice(0, 15),
      appKeywordCount: appKeywords.length,
      compKeywordCount: compKeywords.length,
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json({ error: "Gap analysis failed" }, { status: 502 });
  }
}
