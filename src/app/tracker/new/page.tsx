// src/app/tracker/new/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { CountrySelector } from "@/components/country-selector";
import { AppCard } from "@/components/app-card";
import { useTracker } from "@/lib/tracker";
import { AppResult, SearchResponse } from "@/lib/types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { ChevronLeft, Check } from "lucide-react";

export default function NewTrackerPage() {
  const router = useRouter();
  const { addApp } = useTracker();

  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppResult | null>(null);
  const [keywordsText, setKeywordsText] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&country=${DEFAULT_COUNTRY}&limit=10`);
      if (!res.ok) throw new Error("Search failed");
      const json: SearchResponse = await res.json();
      setSearchData(json);
    } catch {
      setError("Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSelectApp = useCallback((app: AppResult) => {
    setSelectedApp(app);
    setSearchData(null);
  }, []);

  const handleStartTracking = useCallback(() => {
    if (!selectedApp) {
      setError("Select an app first");
      return;
    }
    const keywords = keywordsText
      .split(/[\n,]+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      setError("Enter at least one keyword");
      return;
    }

    addApp(
      {
        trackId: selectedApp.trackId,
        trackName: selectedApp.trackName,
        artworkUrl100: selectedApp.artworkUrl100,
      },
      keywords.map((kw) => ({ keyword: kw, country }))
    );

    router.push("/tracker");
  }, [selectedApp, keywordsText, country, addApp, router]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/tracker"
          className="inline-flex items-center gap-1 mb-6 text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to tracker
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add App to Track</h1>

        {!selectedApp ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Search for an app to start tracking its keyword rankings
            </p>
            <div className="flex items-center gap-3 mb-6">
              <SearchBar onSearch={doSearch} loading={searchLoading} />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {searchData && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Select an app to track:
                </p>
                {searchData.results.slice(0, 10).map((app, i) => (
                  <button
                    key={app.trackId}
                    onClick={() => handleSelectApp(app)}
                    className="w-full text-left"
                  >
                    <AppCard
                      app={app}
                      rank={i + 1}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Image
                src={selectedApp.artworkUrl100}
                alt={selectedApp.trackName}
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <p className="font-semibold text-gray-900">{selectedApp.trackName}</p>
                <p className="text-sm text-gray-500">{selectedApp.sellerName}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Keywords to track
              </label>
              <textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="Enter keywords separated by commas or new lines&#10;e.g.&#10;fitness tracker, workout log, gym app"
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                One check = one API call per keyword. You have 200/hr limit.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Country:</label>
              <CountrySelector value={country} onChange={setCountry} />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartTracking}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Start tracking
            </button>
          </div>
        )}
      </main>
    </>
  );
}
