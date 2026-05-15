// src/app/favorites/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AppCard } from "@/components/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart } from "lucide-react";
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
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3rem)]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/" className={buttonVariants({ variant: "link", className: "mb-6 -ml-3 gap-1" })}>
              <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>

          <h1 className="text-2xl font-bold mb-6">Favorites</h1>

          {apps.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-lg font-medium text-muted-foreground">No favorites yet</p>
              <p className="text-sm mt-1 text-muted-foreground/50">Save apps from search results</p>
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
