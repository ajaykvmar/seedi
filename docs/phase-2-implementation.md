# SEEDI Phase 2 — Implementation Spec

## Overview

Add 5 features using only free Apple APIs + computation on already-fetched data.
Each feature is ordered by dependency (later ones may import from earlier ones).

---

## Feature 1: Description-Based Difficulty

**Goal:** Make keyword difficulty more accurate by checking if top-ranking apps
target the keyword in their **description**, not just their title.

**Files to modify:**
- `src/lib/keyword-analysis.ts`
- `src/lib/apple-api.ts` (minor — expose description in search results)

### 1A. Add description to AppResult type (verify it's already there)

The `normalize()` function in `apple-api.ts` line 76 already maps
`description`, and the Search API results include it. Confirmed: description
is already in `AppResult` and returned by `searchApps()`. No change needed.

### 1B. Enhance `calculateKeywordScores()` in `keyword-analysis.ts`

Add a new sub-signal: **description targeting rate** for the top 10 apps.

After line 54 (titleDensity calculation), add:

```typescript
// 4. Description density (bonus difficulty signal) — 15% weight
// If apps don't have keyword in title BUT have it in description,
// they still compete. This catches keyword-stuffed descriptions.
const descMatchCount = top10.filter((a) => {
  if (!a.description) return false;
  const desc = a.description.toLowerCase();
  return queryWords.some((w) => w.length >= 3 && desc.includes(w));
}).length;
const descDensity = Math.round((descMatchCount / 10) * 15);
```

Then update the difficulty formula to include it:

```typescript
const difficulty = Math.min(
  titleDensity + ratingPower + freshnessBarrier + descDensity,
  100
);
```

Also update the OPPORTUNITY section — the `titleGapScore` should be adjusted:
if apps have keyword in description but not title, the opportunity is lower
than title-only calculation suggests. Add a `descriptionGapPenalty`:

```typescript
// Adjust opportunity: if many apps have keyword in description but not title,
// the window is narrower than title-only check implies.
const descTargetingBonus = Math.round((descMatchCount / 10) * 15);
// titleGapScore stays the same, but we reduce opportunity proportionally
```

Actually simpler: just fold description density into difficulty. Opportunity
is already computed from title gap, freshness, and ranking gap. Description
density makes difficulty more accurate without changing opportunity logic.

**Change summary:**
1. Add `descMatchCount` and `descDensity` in the Difficulty section
2. Add `descDensity` to the `difficulty` sum
3. Cap remains 100

### 1C. Verify test expectations

Check `src/__tests__/keyword-analysis.test.ts` — update any test fixtures
that assert exact difficulty scores (they'll shift by 0-15 points).

---

## Feature 2: Review Topic Tagging

**Goal:** Replace the generic word-cloud in the review section with categorized
topic tags (e.g., "crash", "subscription pricing", "missing feature", "UI/UX").
This makes reviews immediately actionable.

### 2A. Add topic classifier to `src/lib/reviews.ts`

Add a `TOPIC_PATTERNS` map and a `classifyReviewTopics()` function.

After line 21 (end of interface definitions), add:

```typescript
export interface TopicCluster {
  topic: string;
  icon: string;
  count: number;
  sentiment: "positive" | "negative" | "mixed";
  sampleReviews: { title: string; rating: number }[];
}

const TOPIC_PATTERNS: Record<string, { keywords: string[]; icon: string; sentiment: "positive" | "negative" | "mixed" }> = {
  crash: {
    keywords: ["crash", "crashes", "crashed", "crashing", "freeze", "freezes", "frozen", "bug", "glitch", "broken", "unstable", "not working", "doesn't work", "won't open", "keeps closing"],
    icon: "⚠️",
    sentiment: "negative",
  },
  performance: {
    keywords: ["slow", "lag", "lags", "laggy", "loading", "battery drain", "drains battery", "memory", "storage", "heavy", "stutter"],
    icon: "🐌",
    sentiment: "negative",
  },
  pricing: {
    keywords: ["subscription", "price", "pricing", "expensive", "too expensive", "overpriced", "cost", "pay", "paid", "premium", "subscription", "trial", "free trial", "auto renew", "cancel", "refund", "money", "worth", "value", "bait and switch", "hidden"],
    icon: "💰",
    sentiment: "negative",
  },
  ui: {
    keywords: ["interface", "ui", "ux", "design", "ugly", "layout", "confusing", "cluttered", "hard to use", "navigation", "menu", "button", "scroll", "responsive", "dark mode", "accessibility", "font", "color"],
    icon: "🎨",
    sentiment: "mixed",
  },
  missingFeature: {
    keywords: ["wish", "wished", "missing", "add", "please add", "would be great", "need", "needs", "feature request", "suggestion", "ability to", "option to", "support for", "integrate", "integration", "sync", "widget", "apple watch", "widget", "shortcut"],
    icon: "💡",
    sentiment: "mixed",
  },
  ads: {
    keywords: ["ads", "ad", "advertisement", "commercial", "spam", "notification spam", "too many ads", "annoying ads", "pop up", "popup"],
    icon: "📢",
    sentiment: "negative",
  },
  customerSupport: {
    keywords: ["support", "customer service", "help", "response", "reply", "contact", "email", "no response", "ignored", "unresponsive", "refund"],
    icon: "🎧",
    sentiment: "negative",
  },
  update: {
    keywords: ["update", "new version", "latest", "recent update", "old version", "downgrade", "used to", "before update", "after update", "ruined", "worse", "broke"],
    icon: "🔄",
    sentiment: "mixed",
  },
  privacy: {
    keywords: ["privacy", "data", "track", "tracking", "collect", "collects", "personal", "location", "permission", "access", "camera", "microphone", "contacts", "photos"],
    icon: "🔒",
    sentiment: "negative",
  },
};
```

Then add the classifier function before the `getReviews()` function:

```typescript
export function classifyReviewTopics(reviews: Review[]): TopicCluster[] {
  const topicHits = new Map<string, { count: number; reviews: { title: string; rating: number }[] }>();

  for (const review of reviews) {
    const text = (review.title + " " + review.content).toLowerCase();
    for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
      const matched = config.keywords.some((kw) => text.includes(kw));
      if (matched) {
        if (!topicHits.has(topic)) {
          topicHits.set(topic, { count: 0, reviews: [] });
        }
        const entry = topicHits.get(topic)!;
        entry.count++;
        if (entry.reviews.length < 3) {
          entry.reviews.push({ title: review.title, rating: review.rating });
        }
      }
    }
  }

  return Array.from(topicHits.entries())
    .map(([topic, data]) => ({
      topic,
      icon: TOPIC_PATTERNS[topic].icon,
      count: data.count,
      sentiment: TOPIC_PATTERNS[topic].sentiment,
      sampleReviews: data.reviews,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
```

### 2B. Add topic clusters to ReviewSummary

In the `ReviewSummary` interface (line 16 in `reviews.ts`), add:

```typescript
topics?: TopicCluster[];
```

### 2C. Populate topics in `getReviews()`

Before the return statement (around line 156), add:

```typescript
const topics = classifyReviewTopics(allReviews);
```

And include it in the returned object:

```typescript
return {
  averageRating: ...,
  totalReviews,
  distribution,
  topWords,
  recentReviews: ...,
  topics, // add this
};
```

### 2D. Update `src/components/review-section.tsx`

Replace the "Common Words" card (lines 104-115) with a "Topics" section.

Old code (lines 104-115):
```tsx
{/* Top words */}
<Card className="p-5">
  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Common Words</h3>
  <div className="flex flex-wrap gap-2">
    {data.topWords.slice(0, 20).map((w) => (
      <Badge key={w.word} variant="secondary">
        {w.word}
      </Badge>
    ))}
  </div>
</Card>
```

New code:
```tsx
{/* Topic clusters */}
<Card className="p-5">
  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
    Topics
  </h3>
  {data.topics && data.topics.length > 0 ? (
    <div className="space-y-2">
      {data.topics.map((t) => (
        <div key={t.topic} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <span>{t.icon}</span>
            <span className="capitalize font-medium">{t.topic}</span>
            {t.sampleReviews.length > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                — {t.sampleReviews[0].title.slice(0, 40)}
              </span>
            )}
          </span>
          <Badge variant="secondary" className="tabular-nums text-xs">
            {t.count}
          </Badge>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground">Not enough reviews to classify</p>
  )}
</Card>
```

If there are no topics (too few reviews), show the old word cloud as fallback:
```tsx
{(!data.topics || data.topics.length === 0) && data.topWords.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {data.topWords.slice(0, 20).map((w) => (
      <Badge key={w.word} variant="secondary">
        {w.word}
      </Badge>
    ))}
  </div>
)}
```

---

## Feature 3: Release Notes Feature Mining

**Goal:** Extract feature keywords from top apps' release notes to show what
competitors are currently building. This is a unique free feature — no other
free ASO tool does this.

### 3A. New API route: `src/app/api/features/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchApps, lookupApp } from "@/lib/apple-api";

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
```

### 3B. New component: `src/components/feature-trends.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lightbulb, Search } from "lucide-react";

interface FeatureMention {
  keyword: string;
  count: number;
  apps: string[];
  category: "feature" | "improvement" | "integration" | "platform";
}

interface FeaturesResponse {
  features: FeatureMention[];
  total: number;
  sourceCount: number;
  query: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  feature: "bg-blue-100 text-blue-800",
  improvement: "bg-green-100 text-green-800",
  integration: "bg-purple-100 text-purple-800",
  platform: "bg-amber-100 text-amber-800",
};

export function FeatureTrends({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [data, setData] = useState<FeaturesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/features?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to load features");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. workout tracker, photo editor..."
          onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
          className="max-w-md"
        />
        <Button onClick={() => doSearch(query)} disabled={query.trim().length < 2 || loading}>
          {loading ? "Loading..." : "Analyze"}
        </Button>
      </div>

      {error && (
        <Card className="p-3 mb-4 bg-destructive text-destructive-foreground text-sm">{error}</Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Feature mentions extracted from release notes of top {data.sourceCount} apps for &ldquo;{data.query}&rdquo;
          </p>
          <div className="space-y-2">
            {data.features.map((f, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{f.keyword}</span>
                  <Badge className={CATEGORY_COLORS[f.category] || "bg-gray-100 text-gray-700"}>
                    {f.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {f.count} app{f.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {data.features.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No common feature patterns found in release notes
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

### 3C. New page: `src/app/features/page.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { FeatureTrends } from "@/components/feature-trends";
import { Lightbulb } from "lucide-react";

function FeaturesContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Feature Trends</h1>
            <p className="text-sm text-muted-foreground">
              See what features competitors are shipping — mined from release notes
            </p>
          </div>
          <FeatureTrends />
        </div>
      </main>
    </>
  );
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={null}>
      <FeaturesContent />
    </Suspense>
  );
}
```

### 3D. Add link in header navigation

In `src/components/header.tsx`, add a nav link to `/features`:

```tsx
<Link href="/features" className="text-sm font-medium hover:text-foreground transition-colors">
  Features
</Link>
```

---

## Feature 4: Multi-Country Keyword Comparison

**Goal:** Compare keyword difficulty/popularity across US, UK, Canada, Australia,
India simultaneously on one page. Most ASO tools charge for multi-country data;
this is free because the iTunes API is per-country.

### 4A. New API route: `src/app/api/multi-country/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchApps } from "@/lib/apple-api";
import { calculateKeywordScores } from "@/lib/keyword-analysis";

const DEFAULT_COUNTRIES = ["us", "gb", "ca", "au", "in"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const term = searchParams.get("q");
  const countriesParam = searchParams.get("countries");
  const countries = countriesParam
    ? countriesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : DEFAULT_COUNTRIES;

  if (!term || term.trim().length < 2) {
    return NextResponse.json({ error: "Query required (min 2 chars)" }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      countries.map(async (country) => {
        try {
          const apps = await searchApps(term.trim(), country, 25);
          const scores = calculateKeywordScores(apps);
          const totalResults = apps.length;
          const topName = apps[0]?.trackName ?? null;
          return {
            country,
            scores,
            totalResults,
            topApp: topName,
            topRatingCount: apps[0]?.userRatingCount ?? 0,
          };
        } catch {
          return {
            country,
            scores: { popularity: 0, difficulty: 0, opportunity: 0 },
            totalResults: 0,
            topApp: null,
            topRatingCount: 0,
            error: "Failed",
          };
        }
      })
    );

    return NextResponse.json({
      query: term.trim(),
      results,
    });
  } catch (error) {
    console.error("Multi-country error:", error);
    return NextResponse.json({ error: "Multi-country analysis failed" }, { status: 502 });
  }
}
```

### 4B. New component: `src/components/country-comparison.tsx`

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Search } from "lucide-react";

interface CountryScore {
  country: string;
  scores: { popularity: number; difficulty: number; opportunity: number };
  totalResults: number;
  topApp: string | null;
  topRatingCount: number;
  error?: string;
}

interface MultiCountryResponse {
  query: string;
  results: CountryScore[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  us: "🇺🇸", gb: "🇬🇧", ca: "🇨🇦", au: "🇦🇺", in: "🇮🇳",
  de: "🇩🇪", fr: "🇫🇷", jp: "🇯🇵", kr: "🇰🇷", br: "🇧🇷",
};

const COUNTRY_NAMES: Record<string, string> = {
  us: "USA", gb: "UK", ca: "Canada", au: "Australia", in: "India",
  de: "Germany", fr: "France", jp: "Japan", kr: "South Korea", br: "Brazil",
};

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

export function CountryComparison() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<MultiCountryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/multi-country?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a keyword..."
          onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
          className="max-w-md"
        />
        <Button onClick={() => doSearch(query)} disabled={query.trim().length < 2 || loading}>
          {loading ? "Analyzing..." : "Compare"}
        </Button>
      </div>

      {error && (
        <Card className="p-3 mb-4 bg-destructive text-destructive-foreground text-sm">{error}</Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Comparing &ldquo;{data.query}&rdquo; across {data.results.length} countries
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((r) => (
              <Card key={r.count} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{COUNTRY_FLAGS[r.country] || "🌍"}</span>
                  <span className="font-semibold">{COUNTRY_NAMES[r.country] || r.country.toUpperCase()}</span>
                  {r.error && <Badge variant="outline" className="text-xs ml-auto">No data</Badge>}
                </div>
                {!r.error ? (
                  <div className="space-y-1.5">
                    <ScoreBar value={r.scores.popularity} label="Popularity" color="bg-blue-500" />
                    <ScoreBar value={r.scores.difficulty} label="Difficulty" color="bg-red-500" />
                    <ScoreBar value={r.scores.opportunity} label="Opportunity" color="bg-green-500" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <span>{r.totalResults} apps</span>
                      <span className="truncate ml-2">{r.topApp ? r.topApp.slice(0, 24) : "—"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available for this country</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

### 4C. New page: `src/app/multi-country/page.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { CountryComparison } from "@/components/country-comparison";
import { Globe } from "lucide-react";

function MultiCountryContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Multi-Country Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Compare keyword opportunity across stores — free, no API key needed
            </p>
          </div>
          <CountryComparison />
        </div>
      </main>
    </>
  );
}

export default function MultiCountryPage() {
  return (
    <Suspense fallback={null}>
      <MultiCountryContent />
    </Suspense>
  );
}
```

### 4D. Add header link

In `header.tsx`, add:
```tsx
<Link href="/multi-country" className="text-sm font-medium hover:text-foreground transition-colors">
  Countries
</Link>
```

---

## Feature 5: Keyword Gap Analyzer

**Goal:** Compare your app's keyword portfolio vs a competitor's. Shows which
keywords you're both targeting, which you're missing, and vice versa. This
already exists in `competitor-analysis.ts` as `computeOverlap()` — just needs
a dedicated UI.

### 5A. New API route: `src/app/api/gap/route.ts`

```typescript
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
```

### 5B. New component: `src/components/keyword-gap.tsx`

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, X, Plus, Check } from "lucide-react";
import Link from "next/link";

interface GapData {
  app: { trackId: number; trackName: string };
  competitor: { trackId: number; trackName: string };
  overlap: { overlapCount: number; overlapPercentage: number; shared: string[] };
  onlyApp: string[];
  onlyComp: string[];
  appKeywordCount: number;
  compKeywordCount: number;
}

export function KeywordGap() {
  const [appUrl, setAppUrl] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract trackId from App Store URL or accept raw ID
  const extractId = (input: string): number | null => {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const match = trimmed.match(/\/id(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const doAnalysis = async () => {
    const appId = extractId(appUrl);
    const compId = extractId(compUrl);
    if (!appId || !compId) {
      setError("Enter valid App Store URLs or track IDs for both apps");
      return;
    }
    if (appId === compId) {
      setError("App and competitor must be different");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/gap?app=${appId}&competitor=${compId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Your App
          </label>
          <Input
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            placeholder="App Store URL or track ID"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Competitor
          </label>
          <Input
            value={compUrl}
            onChange={(e) => setCompUrl(e.target.value)}
            placeholder="App Store URL or track ID"
          />
        </div>
      </div>
      <Button
        onClick={doAnalysis}
        disabled={!appUrl.trim() || !compUrl.trim() || loading}
        className="mb-6 gap-1"
      >
        <ArrowLeftRight className="h-4 w-4" />
        {loading ? "Analyzing..." : "Compare Keywords"}
      </Button>

      {error && (
        <Card className="p-3 mb-4 bg-destructive text-destructive-foreground text-sm">{error}</Card>
      )}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.appKeywordCount}</p>
              <p className="text-xs text-muted-foreground">{data.app.trackName}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.overlap.overlapPercentage}%</p>
              <p className="text-xs text-muted-foreground">Overlap</p>
              <p className="text-xs text-muted-foreground">{data.overlap.overlapCount} shared keywords</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.compKeywordCount}</p>
              <p className="text-xs text-muted-foreground">{data.competitor.trackName}</p>
            </Card>
          </div>

          {/* Shared keywords */}
          {data.overlap.shared.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                Shared Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.overlap.shared.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Only in your app */}
          {data.onlyApp.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-blue-500" />
                Only in &ldquo;{data.app.trackName}&rdquo;
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.onlyApp.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Only in competitor */}
          {data.onlyComp.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <X className="h-4 w-4 text-red-400" />
                Only in &ldquo;{data.competitor.trackName}&rdquo; — You&rsquo;re missing:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.onlyComp.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="destructive" className="cursor-pointer hover:opacity-80">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
```

### 5C. New page: `src/app/gap/page.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { KeywordGap } from "@/components/keyword-gap";
import { ArrowLeftRight } from "lucide-react";

function GapContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Keyword Gap Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Compare keyword portfolios between any two apps
            </p>
          </div>
          <KeywordGap />
        </div>
      </main>
    </>
  );
}

export default function GapPage() {
  return (
    <Suspense fallback={null}>
      <GapContent />
    </Suspense>
  );
}
```

### 5D. Add header link

In `header.tsx`:
```tsx
<Link href="/gap" className="text-sm font-medium hover:text-foreground transition-colors">
  Gap
</Link>
```

---

## Implementation Order & Verification

### Order (each step is safe to run independently):

1. **Feature 1** (Description Difficulty) — pure backend, no UI. Run tests after.
2. **Feature 2** (Review Topics) — backend + UI change to existing component.
3. **Feature 3** (Feature Trends) — new API route + component + page.
4. **Feature 4** (Multi-Country) — new API route + component + page.
5. **Feature 5** (Gap Analyzer) — new API route + component + page.

### Verification:

After each feature:
1. `npm run build` — should compile without errors
2. `npm test` — all existing tests should pass (update snapshots/fixtures if needed)
3. Start dev server (`npm run dev`) and visually verify the UI

### Note on Feature 1 test impact:
`src/__tests__/keyword-analysis.test.ts` will need its expected difficulty
values updated since we added description density to the formula. Read the
test file first, update the expected values, then run tests.
