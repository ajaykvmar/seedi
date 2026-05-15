// src/app/favorites/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AppCard } from "@/components/app-card";
import { useFavorites } from "@/lib/favorites";
import { AppResult } from "@/lib/types";

export default function FavoritesPage() {
  const { favorites, isFavorite, toggleFavorite, hydrated } = useFavorites();
  const [apps, setApps] = useState<AppResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || favorites.length === 0) {
      setLoading(false);
      return;
    }
    async function fetchApps() {
      setLoading(true);
      const results: AppResult[] = [];
      for (const id of favorites) {
        try {
          const res = await fetch(`/api/app-info?id=${id}`);
          if (res.ok) {
            const app: AppResult = await res.json();
            results.push(app);
          }
        } catch {
          // skip failed fetches
        }
      }
      setApps(results);
      setLoading(false);
    }
    fetchApps();
  }, [favorites, hydrated]);

  if (!hydrated || loading) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center font-bold">LOADING...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3rem)] border-t-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6 text-sm font-medium hover:underline underline-offset-2">
            ← Back to search
          </Link>

          <h1 className="text-2xl font-black mb-6 uppercase">Favorites</h1>

          {apps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-6xl font-black text-gray-100 mb-3">♥</p>
              <p className="text-lg font-bold text-gray-300">No favorites yet</p>
              <p className="text-sm mt-1 text-gray-200">Save apps from search results</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app, i) => (
                <AppCard
                  key={app.trackId}
                  app={app}
                  rank={i + 1}
                  isFavorite={isFavorite(app.trackId)}
                  onToggleFavorite={() => toggleFavorite(app.trackId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
