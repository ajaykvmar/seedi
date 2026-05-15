import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";

// Phrases that sound like features but are just generic maintenance boilerplate
const GENERIC_FEATURES = new Set([
  "bug fixes", "bug fix", "bugfix", "bugfixes",
  "performance improvements", "performance improvement", "performance fixes",
  "stability improvements", "stability improvement", "stability fixes",
  "minor fixes", "minor bug fixes", "minor improvements",
  "general improvements", "general bug fixes", "general fixes",
  "various improvements", "various fixes", "various bug fixes",
  "ui improvements", "ux improvements", "ui fixes",
  "under the hood improvements", "under the hood fixes",
  "enhancements", "minor enhancements",
  "improvements and bug fixes", "bug fixes and improvements",
  "critical fixes", "hotfix", "hot fixes",
]);

// Context patterns that introduce real feature names
// These capture the feature name that follows
const FEATURE_PATTERNS = [
  // "Added X" / "Add X" / "Introducing X"
  /(?:added|add|introducing|introduces|introduce|launching|launches|launched|now with|now featuring|featuring|welcome|includes|include)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Za-z][a-zA-Z0-9]+){1,5})/g,
  // "New X" (where X is 2+ words, capitalized)
  /new\s+([A-Z][a-z]+(?:\s+[A-Za-z][a-z]+){1,5})/g,
  // "X support" / "X integration"
  /([A-Z][a-zA-Z0-9]+(?:\s+[A-Za-z][a-zA-Z0-9]+){1,4})\s+(?:support|integration|compatibility)/g,
  // "Support for X" / "Integration with X"
  /(?:support|integration)\s+(?:for|with)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Za-z][a-zA-Z0-9]+){1,4})/g,
  // Standalone capitalized multi-word names (2-4 words) that look like product/feature names
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g,
];

// Word-level stop list for cleaning (lowercase)
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "this", "that", "from",
  "our", "your", "its", "all", "new", "now", "get", "got", "can",
]);

// Non-feature section headers commonly found in release notes
const SKIP_SECTIONS = [
  /what'?s new/i,
  /what'?s changed/i,
  /release notes/i,
  /version \d/i,
  /overview/i,
  /description/i,
];

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
    const results = await searchApps(query.trim(), country, 25);
    const topAppsWithNotes = results
      .filter((a) => a.releaseNotes && a.releaseNotes.length > 10)
      .slice(0, 10);

    if (topAppsWithNotes.length === 0) {
      return NextResponse.json({ features: [], total: 0 });
    }

    // Extract real feature names from release notes using patterns
    const featureCounts = new Map<string, { count: number; apps: string[] }>();

    for (const app of topAppsWithNotes) {
      const notes = app.releaseNotes!;
      const seen = new Set<string>();

      // Split into bullet points / lines for independent extraction
      const lines = notes
        .split(/[•·\-–—\n\r]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);

      for (const line of lines) {
        // Skip section headers and generic filler
        if (SKIP_SECTIONS.some((r) => r.test(line))) continue;

        const raw = line.trim();

        // First pass: try context patterns (added X, new X, X support, etc.)
        let matched = false;
        for (const pattern of FEATURE_PATTERNS) {
          const matches = raw.matchAll(pattern);
          for (const m of matches) {
            const candidate = m[1]?.trim();
            if (!candidate || candidate.length < 5) continue;

            // Check it's not a generic maintenance phrase
            const lower = candidate.toLowerCase();
            if (GENERIC_FEATURES.has(lower)) continue;

            // Filter: must contain at least one real letter-word (not just version numbers)
            const words = candidate.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
            if (words.length === 0) continue;

            const cleaned = words.join(" ");
            if (cleaned.length < 4 || seen.has(cleaned)) continue;
            seen.add(cleaned);

            if (!featureCounts.has(cleaned)) {
              featureCounts.set(cleaned, { count: 0, apps: [] });
            }
            const entry = featureCounts.get(cleaned)!;
            entry.count++;
            if (!entry.apps.includes(app.trackName)) {
              entry.apps.push(app.trackName);
            }
            matched = true;
          }
          if (matched) break; // one pattern match per line is enough
        }

        // Second pass (if no context match): look for standalone capitalized feature names
        if (!matched) {
          const properMatch = raw.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,4})/);
          if (properMatch) {
            const candidate = properMatch[0].trim();
            const lower = candidate.toLowerCase();
            if (candidate.length >= 6 && !GENERIC_FEATURES.has(lower) && !seen.has(candidate)) {
              seen.add(candidate);
              if (!featureCounts.has(candidate)) {
                featureCounts.set(candidate, { count: 0, apps: [] });
              }
              const entry = featureCounts.get(candidate)!;
              entry.count++;
              if (!entry.apps.includes(app.trackName)) {
                entry.apps.push(app.trackName);
              }
            }
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
  const kw = keyword.toLowerCase();
  if (/watch|widget|siri|shortcut|health|apple (?:watch|pay|health|fitness)|google|fitbit|spotify|integration|connect|sync|import|export/.test(kw)) return "integration";
  if (/ios|ipad|mac|vision|watchos|android|web|desktop|mobile|tablet/.test(kw)) return "platform";
  if (/improve|faster|better|redesign|optimize|enhance|refresh/.test(kw)) return "improvement";
  return "feature";
}
