// src/app/charts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { CountrySelector } from "@/components/country-selector";
import { ChartCard } from "@/components/chart-card";
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
      <main className="min-h-[calc(100vh-3rem)] border-t-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-black mb-6 uppercase">Charts</h1>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex border-2 border-black">
              {FEEDS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFeed(f.value)}
                  className={`px-4 py-2 text-sm font-bold tracking-wider transition-colors ${
                    feed === f.value
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <CountrySelector value={country} onChange={setCountry} />

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 border-2 border-black bg-white text-sm font-bold focus:outline-none"
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
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-2 border-black border-t-transparent animate-spin" />
            </div>
          )}

          {error && (
            <div className="border-2 border-black bg-black text-white p-4 text-sm font-bold">
              {error}
            </div>
          )}

          {data && !loading && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
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
