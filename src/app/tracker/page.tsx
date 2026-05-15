// src/app/tracker/page.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { TrackedAppCard } from "@/components/tracked-app-card";
import { useTracker } from "@/lib/tracker";
import { Plus } from "lucide-react";

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
        <div className="max-w-5xl mx-auto px-4 py-12 text-center font-bold">LOADING...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3rem)] border-t-2 border-black">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black uppercase">Rank Tracker</h1>
              <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">
                Track keyword rankings over time
              </p>
            </div>
            <Link
              href="/tracker/new"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black text-sm font-bold hover:bg-white hover:text-black transition-colors"
            >
              <Plus className="h-4 w-4" />
              ADD APP
            </Link>
          </div>

          {trackedApps.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-6xl font-black text-gray-100 mb-3">[]</p>
              <p className="text-lg font-bold text-gray-300">No apps tracked</p>
              <p className="text-sm mt-1 mb-6 text-gray-200">Track keyword rankings for your apps</p>
              <Link
                href="/tracker/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black text-sm font-bold hover:bg-white hover:text-black transition-colors"
              >
                <Plus className="h-4 w-4" />
                ADD YOUR FIRST APP
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
