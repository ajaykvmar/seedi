// src/lib/tracker.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface RankSnapshot {
  date: number;
  rank: number | null;
  totalResults: number;
}

export interface TrackedKeyword {
  keyword: string;
  country: string;
  history: RankSnapshot[];
}

export interface TrackedApp {
  id: string;
  trackId: number;
  trackName: string;
  artworkUrl100: string;
  keywords: TrackedKeyword[];
  createdAt: number;
  version?: string;
  lastVersionCheck?: number;
  versionHistory?: { version: string; date: number }[];
}

const STORAGE_KEY = "aso-tracker";

function loadApps(): TrackedApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedApp[]) : [];
  } catch {
    return [];
  }
}

function saveApps(apps: TrackedApp[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

let appIdCounter = 0;
function generateId(): string {
  appIdCounter++;
  return `app_${Date.now()}_${appIdCounter}`;
}

export function useTracker() {
  const [trackedApps, setTrackedApps] = useState<TrackedApp[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTrackedApps(loadApps());
    setHydrated(true);
  }, []);

  const persist = useCallback((fn: (prev: TrackedApp[]) => TrackedApp[]) => {
    setTrackedApps((prev) => {
      const next = fn(prev);
      saveApps(next);
      return next;
    });
  }, []);

  const addApp = useCallback(
    (
      info: { trackId: number; trackName: string; artworkUrl100: string },
      keywords: { keyword: string; country: string }[]
    ) => {
      persist((prev) => {
        if (prev.some((a) => a.trackId === info.trackId)) return prev;
        const app: TrackedApp = {
          id: generateId(),
          trackId: info.trackId,
          trackName: info.trackName,
          artworkUrl100: info.artworkUrl100,
          keywords: keywords.map((k) => ({
            keyword: k.keyword,
            country: k.country,
            history: [],
          })),
          createdAt: Date.now(),
        };
        return [...prev, app];
      });
    },
    [persist]
  );

  const removeApp = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((a) => a.id !== id));
    },
    [persist]
  );

  const addKeyword = useCallback(
    (appId: string, keyword: string, country: string) => {
      persist((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                keywords: [
                  ...app.keywords,
                  { keyword, country, history: [] },
                ],
              }
            : app
        )
      );
    },
    [persist]
  );

  const removeKeyword = useCallback(
    (appId: string, keywordIndex: number) => {
      persist((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                keywords: app.keywords.filter((_, i) => i !== keywordIndex),
              }
            : app
        )
      );
    },
    [persist]
  );

  const checkKeyword = useCallback(
    async (appId: string, keywordIndex: number): Promise<void> => {
      const app = trackedApps.find((a) => a.id === appId);
      if (!app) return;
      const kw = app.keywords[keywordIndex];
      if (!kw) return;

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(kw.keyword)}&country=${kw.country}&limit=25`
        );
        if (!res.ok) return;
        const json = await res.json();
        const results: { trackId: number }[] = json.results ?? [];
        const foundIndex = results.findIndex((r) => r.trackId === app.trackId);
        const snapshot: RankSnapshot = {
          date: Date.now(),
          rank: foundIndex >= 0 ? foundIndex + 1 : null,
          totalResults: results.length,
        };

        persist((prev) =>
          prev.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  keywords: a.keywords.map((k, i) =>
                    i === keywordIndex
                      ? {
                          ...k,
                          history: [...k.history, snapshot].slice(-30),
                        }
                      : k
                  ),
                }
              : a
          )
        );
      } catch {
        // silent fail
      }
    },
    [trackedApps, persist]
  );

  const checkAll = useCallback(
    async (appId: string): Promise<void> => {
      const app = trackedApps.find((a) => a.id === appId);
      if (!app) return;
      for (let i = 0; i < app.keywords.length; i++) {
        await checkKeyword(appId, i);
      }
    },
    [trackedApps, checkKeyword]
  );

  const checkVersion = useCallback(
    async (appId: string): Promise<string | null> => {
      const app = trackedApps.find((a) => a.id === appId);
      if (!app) return null;

      try {
        const res = await fetch(`/api/app-info?id=${app.trackId}`);
        if (!res.ok) return null;
        const info = await res.json();
        const currentVersion: string = info.version ?? "";

        if (!currentVersion) return null;

        let updated = false;
        persist((prev) =>
          prev.map((a) => {
            if (a.id !== appId) return a;
            const prevVersion = a.version;
            const history = a.versionHistory ?? [];
            if (currentVersion !== prevVersion) {
              updated = true;
              return {
                ...a,
                version: currentVersion,
                lastVersionCheck: Date.now(),
                versionHistory: [
                  ...history,
                  { version: currentVersion, date: Date.now() },
                ].slice(-20),
              };
            }
            return {
              ...a,
              lastVersionCheck: Date.now(),
            };
          })
        );

        return currentVersion;
      } catch {
        return null;
      }
    },
    [trackedApps, persist]
  );

  return {
    trackedApps,
    hydrated,
    addApp,
    removeApp,
    addKeyword,
    removeKeyword,
    checkKeyword,
    checkAll,
    checkVersion,
  };
}

export type TrackerStore = ReturnType<typeof useTracker>;
