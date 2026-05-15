// src/app/tracker/page.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { TrackedAppCard } from "@/components/tracked-app-card";
import { useTracker } from "@/lib/tracker";
import { BarChart3, Plus } from "lucide-react";

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
    [trackedApps, checkAll]
  );

  if (!hydrated) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rank Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your app&apos;s keyword rankings over time
            </p>
          </div>
          <Link
            href="/tracker/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add App
          </Link>
        </div>

        {trackedApps.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg">No apps tracked yet</p>
            <p className="text-sm mt-1 mb-6">
              Add an app and keywords to start tracking rankings
            </p>
            <Link
              href="/tracker/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add your first app
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
      </main>
    </>
  );
}
