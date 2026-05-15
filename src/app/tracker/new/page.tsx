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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTracker } from "@/lib/tracker";
import { AppResult, SearchResponse } from "@/lib/types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { Check, ArrowLeft } from "lucide-react";

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
      <main className="min-h-[calc(100vh-3rem)]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/tracker" className={buttonVariants({ variant: "link", className: "mb-6 -ml-3 gap-1" })}>
              <ArrowLeft className="h-4 w-4" /> Back to tracker
          </Link>

          <h1 className="text-2xl font-bold mb-6">Add App to Track</h1>

          {!selectedApp ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Search for an app to track its keyword rankings
              </p>
              <div className="flex items-center gap-3 mb-6">
                <SearchBar onSearch={doSearch} loading={searchLoading} />
              </div>

              {error && (
                <Card className="mb-4 p-3 bg-destructive text-destructive-foreground">
                  <p className="text-sm font-medium">{error}</p>
                </Card>
              )}

              {searchData && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
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
              <Card className="flex-row items-center gap-4 p-4 bg-primary text-primary-foreground">
                <Image
                  src={selectedApp.artworkUrl100}
                  alt={selectedApp.trackName}
                  width={48}
                  height={48}
                  className="rounded border"
                />
                <div>
                  <p className="font-semibold">{selectedApp.trackName}</p>
                  <p className="text-sm text-primary-foreground/70">{selectedApp.sellerName}</p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSelectedApp(null)}
                  className="ml-auto text-primary-foreground/80 hover:text-primary-foreground"
                >
                  Change
                </Button>
              </Card>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Keywords to track
                </label>
                <Textarea
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="Enter keywords separated by commas or new lines&#10;&#10;e.g.&#10;fitness tracker, workout log, gym app"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One check = one API call per keyword
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country:</label>
                <CountrySelector value={country} onChange={setCountry} />
              </div>

              {error && (
                <Card className="p-3 bg-destructive text-destructive-foreground">
                  <p className="text-sm font-medium">{error}</p>
                </Card>
              )}

              <Button onClick={handleStartTracking} className="gap-1">
                <Check className="h-4 w-4" />
                Start Tracking
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
