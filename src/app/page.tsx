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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleQueryChange = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        setSuggestions(json.suggestions ?? []);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

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
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {!data && (
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                ASO Analysis for App Store
              </h1>
              <p className="text-lg text-gray-600">
                Research keywords, find trending apps, and unlock ASO insights
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mb-8">
            <SearchBar onSearch={(q) => doSearch(q)} onQueryChange={handleQueryChange} loading={loading} suggestions={suggestions} onSelectSuggestion={(s) => doSearch(s)} />
            <CountrySelector value={country} onChange={handleCountryChange} />
          </div>

          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
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
            <div className="text-center mt-20 text-gray-400">
              <p className="text-lg">Search for an app or keyword to get started</p>
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
