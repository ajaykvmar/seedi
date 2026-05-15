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
import { Check } from "lucide-react";

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
      <main className="min-h-[calc(100vh-3rem)] border-t-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/tracker"
            className="inline-flex items-center gap-1 mb-6 text-sm font-medium hover:underline underline-offset-2"
          >
            ← Back to tracker
          </Link>

          <h1 className="text-2xl font-black mb-6 uppercase">Add App to Track</h1>

          {!selectedApp ? (
            <>
              <p className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                Search for an app to track its keyword rankings
              </p>
              <div className="flex items-center gap-3 mb-6">
                <SearchBar onSearch={doSearch} loading={searchLoading} />
              </div>

              {error && (
                <div className="mb-4 p-3 border-2 border-black bg-black text-white text-sm font-bold">
                  {error}
                </div>
              )}

              {searchData && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Select an app:
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
              <div className="flex items-center gap-4 p-4 border-2 border-black bg-black text-white">
                <Image
                  src={selectedApp.artworkUrl100}
                  alt={selectedApp.trackName}
                  width={48}
                  height={48}
                  className="border-2 border-white"
                />
                <div>
                  <p className="font-bold">{selectedApp.trackName}</p>
                  <p className="text-sm text-gray-300">{selectedApp.sellerName}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="ml-auto text-sm font-bold underline underline-offset-2"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Keywords to track
                </label>
                <textarea
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder={"Enter keywords separated by commas or new lines\n\ne.g.\nfitness tracker, workout log, gym app"}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-medium focus:outline-none placeholder:text-gray-300"
                />
                <p className="text-xs font-medium text-gray-400 mt-1">
                  One check = one API call per keyword
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider">Country:</label>
                <CountrySelector value={country} onChange={setCountry} />
              </div>

              {error && (
                <div className="p-3 border-2 border-black bg-black text-white text-sm font-bold">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartTracking}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white border-2 border-black text-sm font-bold hover:bg-white hover:text-black transition-colors"
              >
                <Check className="h-4 w-4" />
                START TRACKING
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
