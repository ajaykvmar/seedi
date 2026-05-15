// src/app/charts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { CountrySelector } from "@/components/country-selector";
import { ChartCard } from "@/components/chart-card";
import { type FeedType, type ChartFeed } from "@/lib/charts";
import { Loader2, TrendingUp, DollarSign } from "lucide-react";

const FEEDS: { value: FeedType; label: string; icon: React.ReactNode }[] = [
  { value: "top-free", label: "Top Free", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "top-paid", label: "Top Paid", icon: <DollarSign className="h-4 w-4" /> },
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">App Store Charts</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Feed tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {FEEDS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFeed(f.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                feed === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        <CountrySelector value={country} onChange={setCountry} />

        {/* Limit selector */}
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700"
          aria-label="Result limit"
        >
          {LIMITS.map((l) => (
            <option key={l} value={l}>
              Top {l}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {data && !loading && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {data.title} · {data.country.toUpperCase()} store · Updated{" "}
            {new Date(data.updated).toLocaleDateString()}
          </p>
          <div className="space-y-3">
            {data.results.map((app, i) => (
              <ChartCard key={app.id} app={app} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
