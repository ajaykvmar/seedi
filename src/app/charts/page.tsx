// src/app/charts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { CountrySelector } from "@/components/country-selector";
import { ChartCard } from "@/components/chart-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type FeedType, type ChartFeed } from "@/lib/charts";
import { Header } from "@/components/header";

const FEEDS: { value: FeedType; label: string }[] = [
  { value: "top-free", label: "TOP FREE" },
  { value: "top-paid", label: "TOP PAID" },
];

const LIMITS = [10, 25, 50, 100];

export default function ChartsPage() {
  const [country, setCountry] = useState("us");
  const [feed, setFeed] = useState<FeedType>("top-free");
  const [limit, setLimit] = useState(25);
  const [data, setData] = useState<ChartFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/charts?country=${country}&feed=${feed}&limit=${limit}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load charts");
    } finally {
      setLoading(false);
    }
  }, [country, feed, limit]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3rem)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Charts</h1>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex border rounded-md overflow-hidden">
              {FEEDS.map((f) => (
                <Button
                  key={f.value}
                  variant={feed === f.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFeed(f.value)}
                  className="rounded-none"
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <CountrySelector value={country} onChange={setCountry} />

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
              aria-label="Result limit"
            >
              {LIMITS.map((l) => (
                <option key={l} value={l}>
                  Top {l}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full" />
              ))}
            </div>
          )}

          {error && (
            <Card className="p-4 bg-destructive text-destructive-foreground">
              <p className="text-sm font-medium">{error}</p>
            </Card>
          )}

          {data && !loading && (
            <div>
              <p className="text-xs text-muted-foreground mb-4">
                {data.title} · {data.country.toUpperCase()} store · Updated {new Date(data.updated).toLocaleDateString()}
              </p>
              <div className="space-y-3">
                {data.results.map((app, i) => (
                  <ChartCard key={app.id} app={app} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
