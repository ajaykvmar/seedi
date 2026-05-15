// src/app/page.tsx
"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { CountrySelector } from "@/components/country-selector";
import { SearchResults } from "@/components/search-results";
import { Card } from "@/components/ui/card";
import { SearchResponse } from "@/lib/types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { useFavorites } from "@/lib/favorites";

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [lastQuery, setLastQuery] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();

  // Auto-search when ?q= param is present on mount
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim().length >= 2) {
      doSearch(q.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = useCallback(
    async (query: string, cc?: string) => {
      const countryCode = cc ?? country;
      setLoading(true);
      setError("");
      setLastQuery(query);

      // Update URL so searches are shareable/bookmarkable
      const params = new URLSearchParams();
      params.set("q", query);
      if (countryCode !== DEFAULT_COUNTRY) params.set("country", countryCode);
      router.replace(`/?${params.toString()}`, { scroll: false });

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&country=${countryCode}`
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Search failed");
        }
        const json: SearchResponse = await res.json();
        setData(json);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [country, router]
  );

  const handleCountryChange = useCallback(
    (newCountry: string) => {
      setCountry(newCountry);
      if (lastQuery) {
        doSearch(lastQuery, newCountry);
      }
    },
    [lastQuery, doSearch]
  );

  const handleRelatedTermClick = useCallback(
    (term: string) => {
      doSearch(term);
    },
    [doSearch]
  );

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3rem)]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {!data && (
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold tracking-tight mb-3">
                SEEDI
              </h1>
              <p className="text-base text-muted-foreground">
                App Store Intelligence
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mb-8">
            <SearchBar onSearch={(q) => doSearch(q)} loading={loading} />
            <CountrySelector value={country} onChange={handleCountryChange} />
          </div>

          {error && (
            <Card className="max-w-2xl mx-auto mb-8 p-4 bg-destructive text-destructive-foreground">
              <p className="text-sm font-medium">{error}</p>
            </Card>
          )}

          {data && (
            <SearchResults
              data={data}
              onRelatedTermClick={handleRelatedTermClick}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {!data && !loading && (
            <div className="text-center mt-20 text-muted-foreground">
              <p className="text-lg font-medium">Search for an app or keyword</p>
              <p className="text-sm mt-2 text-muted-foreground/60">
                e.g. &ldquo;instagram&rdquo;, &ldquo;fitness tracker&rdquo;, &ldquo;photo editor&rdquo;
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
