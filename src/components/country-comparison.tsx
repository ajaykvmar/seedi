"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  us: "🇺🇸", ca: "🇨🇦", gb: "🇬🇧", au: "🇦🇺", ie: "🇮🇪", nz: "🇳🇿",
  de: "🇩🇪", fr: "🇫🇷", nl: "🇳🇱", be: "🇧🇪", lu: "🇱🇺", at: "🇦🇹",
  ch: "🇨🇭", se: "🇸🇪", no: "🇳🇴", dk: "🇩🇰", fi: "🇫🇮", is: "🇮🇸",
  it: "🇮🇹", es: "🇪🇸", cy: "🇨🇾", mt: "🇲🇹",
  jp: "🇯🇵", kr: "🇰🇷", sg: "🇸🇬", hk: "🇭🇰", tw: "🇹🇼",
  ae: "🇦🇪", il: "🇮🇱", qa: "🇶🇦", kw: "🇰🇼",
};

const COUNTRY_NAMES: Record<string, string> = {
  us: "USA", ca: "Canada", gb: "UK", au: "Australia", ie: "Ireland", nz: "New Zealand",
  de: "Germany", fr: "France", nl: "Netherlands", be: "Belgium", lu: "Luxembourg", at: "Austria",
  ch: "Switzerland", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", is: "Iceland",
  it: "Italy", es: "Spain", cy: "Cyprus", mt: "Malta",
  jp: "Japan", kr: "South Korea", sg: "Singapore", hk: "Hong Kong", tw: "Taiwan",
  ae: "UAE", il: "Israel", qa: "Qatar", kw: "Kuwait",
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
          {Array.from({ length: 12 }).map((_, i) => (
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
              <Card key={r.country} className="p-4">
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
