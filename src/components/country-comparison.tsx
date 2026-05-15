"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, ExternalLink } from "lucide-react";

interface CountryScore {
  country: string;
  scores: { popularity: number; difficulty: number; opportunity: number };
  targetScore: number;
  totalResults: number;
  topApp: string | null;
  topRatingCount: number;
  error?: string;
}

interface MultiCountryResponse {
  query: string;
  results: CountryScore[];
}

interface AppResult {
  trackId: number;
  trackName: string;
  averageUserRating: number;
  userRatingCount: number;
  trackViewUrl: string;
  primaryGenreName: string;
  releaseDate: string;
}

const LOW_CAPITA = new Set(["br", "mx", "tr", "ru", "pl", "in", "za"]);

const COUNTRY_FLAGS: Record<string, string> = {
  us: "🇺🇸", ca: "🇨🇦", gb: "🇬🇧", au: "🇦🇺", ie: "🇮🇪", nz: "🇳🇿",
  de: "🇩🇪", fr: "🇫🇷", nl: "🇳🇱", be: "🇧🇪", lu: "🇱🇺", at: "🇦🇹",
  ch: "🇨🇭", se: "🇸🇪", no: "🇳🇴", dk: "🇩🇰", fi: "🇫🇮", is: "🇮🇸",
  it: "🇮🇹", es: "🇪🇸", cy: "🇨🇾", mt: "🇲🇹",
  jp: "🇯🇵", kr: "🇰🇷", sg: "🇸🇬", hk: "🇭🇰", tw: "🇹🇼",
  ae: "🇦🇪", il: "🇮🇱", qa: "🇶🇦", kw: "🇰🇼",
  br: "🇧🇷", mx: "🇲🇽", tr: "🇹🇷", ru: "🇷🇺", pl: "🇵🇱",
  in: "🇮🇳", za: "🇿🇦",
};

const COUNTRY_NAMES: Record<string, string> = {
  us: "USA", ca: "Canada", gb: "UK", au: "Australia", ie: "Ireland", nz: "New Zealand",
  de: "Germany", fr: "France", nl: "Netherlands", be: "Belgium", lu: "Luxembourg", at: "Austria",
  ch: "Switzerland", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", is: "Iceland",
  it: "Italy", es: "Spain", cy: "Cyprus", mt: "Malta",
  jp: "Japan", kr: "South Korea", sg: "Singapore", hk: "Hong Kong", tw: "Taiwan",
  ae: "UAE", il: "Israel", qa: "Qatar", kw: "Kuwait",
  br: "Brazil", mx: "Mexico", tr: "Türkiye", ru: "Russia", pl: "Poland",
  in: "India", za: "South Africa",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [apps, setApps] = useState<AppResult[] | null>(null);
  const [appsLoading, setAppsLoading] = useState(false);

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

  const openRankings = async (country: string, term: string) => {
    setSelectedCountry(country);
    setApps(null);
    setDialogOpen(true);
    setAppsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&country=${country}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setApps(json.results || []);
      } else {
        setApps([]);
      }
    } catch {
      setApps([]);
    } finally {
      setAppsLoading(false);
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
            Comparing &ldquo;{data.query}&rdquo; across {data.results.length} countries &mdash; ranked by target score &mdash; click a card to see ranking apps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((r, i) => {
              const ts = r.targetScore ?? 0;
              const tier = ts >= 65 ? "good" : ts >= 40 ? "okay" : "tough";
              const borderColor = tier === "good"
                ? "border-green-500/40"
                : tier === "okay"
                ? "border-amber-400/40"
                : "border-red-400/40";
              const tierLabel = tier === "good" ? "Target" : tier === "okay" ? "Okay" : "Tough";
              const tierBadge = tier === "good"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : tier === "okay"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

              return (
                <Card
                  key={r.country}
                  className={`p-4 border-2 ${borderColor} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => openRankings(r.country, data.query)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{COUNTRY_FLAGS[r.country] || "🌍"}</span>
                    <span className="font-semibold">{COUNTRY_NAMES[r.country] || r.country.toUpperCase()}</span>
                    {LOW_CAPITA.has(r.country) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground/60 border-muted-foreground/20">low capita</Badge>}
                    {r.error && <Badge variant="outline" className="text-xs ml-auto">No data</Badge>}
                    {!r.error && (
                      <Badge className={`ml-auto text-[10px] px-1.5 py-0 h-4 ${tierBadge}`}>
                        #{i + 1} {tierLabel}
                      </Badge>
                    )}
                  </div>
                  {!r.error ? (
                    <div className="space-y-1.5">
                      <ScoreBar value={ts} label="Target Score" color="bg-emerald-500" />
                      <ScoreBar value={r.scores.popularity} label="Popularity" color="bg-blue-500" />
                      <ScoreBar value={r.scores.difficulty} label="Difficulty" color="bg-red-500" />
                      <ScoreBar value={r.scores.opportunity} label="Opportunity" color="bg-green-500" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                        <span>{r.totalResults} apps</span>
                        <span className="truncate ml-2">{r.topApp ? r.topApp.slice(0, 24) : "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No data available for this country</p>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setApps(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedCountry ? `${COUNTRY_FLAGS[selectedCountry] || "🌍"} ${COUNTRY_NAMES[selectedCountry] || selectedCountry.toUpperCase()}` : ""} &mdash; Top Apps for &ldquo;{data?.query || ""}&rdquo;
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1 -mx-1 px-1">
            {appsLoading && (
              <div className="space-y-2 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {!appsLoading && apps && apps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
            )}
            {!appsLoading && apps && apps.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left font-medium py-2 pr-2 w-6">#</th>
                    <th className="text-left font-medium py-2">App</th>
                    <th className="text-right font-medium py-2 px-2">Rating</th>
                    <th className="text-right font-medium py-2 pl-2">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 10).map((app, i) => (
                    <tr key={app.trackId} className="border-b border-border/30 last:border-0">
                      <td className="py-2 pr-2 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
                      <td className="py-2">
                        <a
                          href={app.trackViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-primary group"
                        >
                          <span className="truncate max-w-[200px] font-medium">{app.trackName}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-primary" />
                        </a>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <StarRating rating={app.averageUserRating} />
                          <span className="text-xs tabular-nums text-muted-foreground ml-1">{app.averageUserRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums text-muted-foreground">
                        {app.userRatingCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
