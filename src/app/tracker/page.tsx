// src/app/tracker/page.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { TrackedAppCard } from "@/components/tracked-app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracker } from "@/lib/tracker";
import { Plus, BarChart3 } from "lucide-react";

export default function TrackerPage() {
  const {
    trackedApps,
    hydrated,
    removeApp,
    removeKeyword,
    checkKeyword,
    checkAll,
    checkVersion,
  } = useTracker();

  const [checking, setChecking] = useState<Set<string>>(new Set());

  const handleCheckKeyword = useCallback(
    async (appId: string, keywordIndex: number) => {
      const key = `${appId}:${keywordIndex}`;
      setChecking((prev) => new Set(prev).add(key));
      await checkKeyword(appId, keywordIndex);
      setChecking((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [checkKeyword]
  );

  const handleCheckAll = useCallback(
    async (appId: string) => {
      const app = trackedApps.find((a) => a.id === appId);
      if (!app) return;
      const keys = app.keywords.map((_, i) => `${appId}:${i}`);
      setChecking((prev) => new Set([...prev, ...keys]));
      await checkAll(appId);
      await checkVersion(appId);
      setChecking((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    },
    [trackedApps, checkAll, checkVersion]
  );

  if (!hydrated) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
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
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Rank Tracker</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track keyword rankings over time
              </p>
            </div>
            <Link href="/tracker/new" className={buttonVariants({ className: "gap-1" })}>
                <Plus className="h-4 w-4" />
                Add App
            </Link>
          </div>

          {trackedApps.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="h-16 w-16 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-lg font-medium text-muted-foreground">No apps tracked</p>
              <p className="text-sm mt-1 mb-6 text-muted-foreground/50">Track keyword rankings for your apps</p>
              <Link href="/tracker/new" className={buttonVariants({ className: "gap-1" })}>
                  <Plus className="h-4 w-4" />
                  Add Your First App
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {trackedApps.map((app) => (
                <TrackedAppCard
                  key={app.id}
                  app={app}
                  checking={checking}
                  onRemoveApp={removeApp}
                  onRemoveKeyword={removeKeyword}
                  onCheckKeyword={handleCheckKeyword}
                  onCheckAll={handleCheckAll}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
