import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";

const FEATURE_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "new", "added", "fixed",
  "improved", "updated", "bug", "fixes", "bugs", "performance", "stability",
  "enhancements", "better", "now", "get", "got", "make", "made", "various",
  "minor", "major", "general", "other", "more", "some", "all", "several",
  "include", "includes", "including", "support", "supports", "supported",
]);

interface FeatureMention {
  keyword: string;
  count: number;
  apps: string[];
  category: "feature" | "improvement" | "integration" | "platform";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const country = searchParams.get("country") || "us";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query required (min 2 chars)" }, { status: 400 });
  }

  try {
    // Fetch top apps in this keyword space
    const results = await searchApps(query.trim(), country, 25);
    const topAppsWithNotes = results
      .filter((a) => a.releaseNotes && a.releaseNotes.length > 10)
      .slice(0, 10);

    if (topAppsWithNotes.length === 0) {
      return NextResponse.json({ features: [], total: 0 });
    }

    // Extract feature mentions from release notes
    const featureCounts = new Map<string, { count: number; apps: string[] }>();

    for (const app of topAppsWithNotes) {
      const notes = app.releaseNotes!.toLowerCase();
      // Split by common delimiters: bullet points, periods, newlines, commas
      const segments = notes
        .split(/[•·\-–—\n\r]+/)
        .flatMap((s) => s.split(/\.\s+/))
        .map((s) => s.trim())
        .filter((s) => s.length > 8 && s.length < 120);

      // Extract 2-3 word phrases from each segment
      const seen = new Set<string>();
      for (const segment of segments) {
        const words = segment
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !FEATURE_STOP_WORDS.has(w));

        // Extract bigrams and trigrams
        const phrases: string[] = [];
        for (let i = 0; i < words.length - 1; i++) {
          if (words[i].length >= 3 && words[i + 1].length >= 3) {
            phrases.push(`${words[i]} ${words[i + 1]}`);
          }
        }
        for (let i = 0; i < words.length - 2; i++) {
          if (words[i].length >= 3 && words[i + 1].length >= 3 && words[i + 2].length >= 3) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
          }
        }

        // Also extract individual notable words (capitalized in original = feature names)
        const notableWords = words.filter((w) => {
          const orig = app.releaseNotes || "";
          const idx = orig.toLowerCase().indexOf(w);
          if (idx >= 0 && idx + w.length < orig.length) {
            // Check if original has capital letter
            return orig[idx] === orig[idx].toUpperCase() && orig[idx] !== orig[idx].toLowerCase();
          }
          return false;
        });

        const allPhrases = [...new Set([...phrases, ...notableWords])];
        for (const phrase of allPhrases) {
          if (seen.has(phrase)) continue;
          seen.add(phrase);
          if (!featureCounts.has(phrase)) {
            featureCounts.set(phrase, { count: 0, apps: [] });
          }
          const entry = featureCounts.get(phrase)!;
          entry.count++;
          if (!entry.apps.includes(app.trackName)) {
            entry.apps.push(app.trackName);
          }
        }
      }
    }

    const features: FeatureMention[] = Array.from(featureCounts.entries())
      .filter(([_, data]) => data.count >= 2) // must appear in 2+ apps
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        apps: data.apps,
        category: inferCategory(keyword),
      }));

    return NextResponse.json({
      features,
      total: features.length,
      sourceCount: topAppsWithNotes.length,
      query: query.trim(),
    });
  } catch (error) {
    console.error("Features error:", error);
    return NextResponse.json({ error: "Failed to analyze features" }, { status: 502 });
  }
}

function inferCategory(keyword: string): FeatureMention["category"] {
  const integKeywords = ["integration", "connect", "sync", "import", "export", "share", "widget", "watch", "siri", "shortcut", "health", "apple", "google", "fitbit", "spotify"];
  const platKeywords = ["ios", "ipad", "mac", "vision", "watchos", "android", "web", "desktop", "mobile", "tablet"];
  const imprKeywords = ["improve", "faster", "redesign", "new design", "refresh", "remodel", "optimize", "better", "enhance"];

  const kw = keyword.toLowerCase();
  if (integKeywords.some((k) => kw.includes(k))) return "integration";
  if (platKeywords.some((k) => kw.includes(k))) return "platform";
  if (imprKeywords.some((k) => kw.includes(k))) return "improvement";
  return "feature";
}
