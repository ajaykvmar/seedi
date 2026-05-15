// src/app/page.tsx
"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { CountrySelector } from "@/components/country-selector";
import { SearchResults } from "@/components/search-results";
import { SearchResponse } from "@/lib/types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { useFavorites } from "@/lib/favorites";

export default function HomePage() {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [lastQuery, setLastQuery] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();

  const doSearch = useCallback(
    async (query: string, cc?: string) => {
      const countryCode = cc ?? country;
      setLoading(true);
      setError("");
      setLastQuery(query);
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
    [country]
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
      <main className="min-h-[calc(100vh-3rem)] border-t-2 border-black">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {!data && (
            <div className="text-center mb-10">
              <h1 className="text-5xl font-black tracking-tighter mb-3 uppercase">
                SEEDI
              </h1>
              <p className="text-base font-medium text-gray-500 uppercase tracking-wider">
                App Store Intelligence
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mb-8">
            <SearchBar onSearch={(q) => doSearch(q)} loading={loading} />
            <CountrySelector value={country} onChange={handleCountryChange} />
          </div>

          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 border-2 border-black bg-black text-white text-sm font-bold">
              {error}
            </div>
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
            <div className="text-center mt-20 text-gray-300">
              <p className="text-lg font-bold">Search for an app or keyword</p>
              <p className="text-sm mt-2">
                e.g. &ldquo;instagram&rdquo;, &ldquo;fitness tracker&rdquo;, &ldquo;photo editor&rdquo;
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
