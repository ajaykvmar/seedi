// src/app/favorites/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AppCard } from "@/components/app-card";
import { useFavorites } from "@/lib/favorites";
import { AppResult } from "@/lib/types";
import { ChevronLeft, Heart } from "lucide-react";

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
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 mb-6 text-sm text-gray-500 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Back to search
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Favorites</h1>

        {apps.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg">No favorites yet</p>
            <p className="text-sm mt-1">Heart an app in search results to save it here</p>
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
      </main>
    </>
  );
}
