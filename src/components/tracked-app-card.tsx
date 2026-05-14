// src/components/tracked-app-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { TrackedApp } from "@/lib/tracker";
import { RankHistoryChart } from "@/components/rank-history-chart";
import { Trash2, RefreshCw } from "lucide-react";

interface TrackedAppCardProps {
  app: TrackedApp;
  checking: Set<string>;
  onRemoveApp: (id: string) => void;
  onRemoveKeyword: (appId: string, keywordIndex: number) => void;
  onCheckKeyword: (appId: string, keywordIndex: number) => void;
  onCheckAll: (appId: string) => void;
}

function rankColor(rank: number | null): string {
  if (rank === null) return "text-gray-400 bg-gray-50";
  if (rank <= 5) return "text-green-700 bg-green-50";
  if (rank <= 15) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

function trendSymbol(history: { rank: number | null }[]): string {
  if (history.length < 2) return "—";
  const prev = history[history.length - 2]?.rank ?? 25;
  const curr = history[history.length - 1]?.rank ?? 25;
  if (curr < prev) return "↑";
  if (curr > prev) return "↓";
  return "→";
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export function TrackedAppCard({
  app,
  checking,
  onRemoveApp,
  onRemoveKeyword,
  onCheckKeyword,
  onCheckAll,
}: TrackedAppCardProps) {
  const isCheckingAll = app.keywords.every((_, i) =>
    checking.has(`${app.id}:${i}`)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/app/${app.trackId}`}
          className="flex items-center gap-3"
        >
          <Image
            src={app.artworkUrl100}
            alt={app.trackName}
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{app.trackName}</h3>
            <p className="text-xs text-gray-400">
              {app.keywords.length} keyword{app.keywords.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCheckAll(app.id)}
            disabled={isCheckingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingAll ? "animate-spin" : ""}`} />
            {isCheckingAll ? "Checking..." : "Check all"}
          </button>
          <button
            onClick={() => onRemoveApp(app.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove app"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="pb-2 pr-3">Keyword</th>
            <th className="pb-2 pr-3">Country</th>
            <th className="pb-2 pr-3">Rank</th>
            <th className="pb-2 pr-3">Trend</th>
            <th className="pb-2 pr-3 w-20">History</th>
            <th className="pb-2 pr-3">Last check</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {app.keywords.map((kw, i) => {
            const last = kw.history[kw.history.length - 1];
            const isChecking = checking.has(`${app.id}:${i}`);
            return (
              <tr key={`${kw.keyword}-${kw.country}-${i}`} className="border-t border-gray-50">
                <td className="py-2.5 pr-3 font-medium">{kw.keyword}</td>
                <td className="py-2.5 pr-3 uppercase text-xs">{kw.country}</td>
                <td className="py-2.5 pr-3">
                  {last ? (
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${rankColor(last.rank)}`}>
                      {last.rank ? `#${last.rank}` : "—"}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-sm">
                  {last ? trendSymbol(kw.history) : "—"}
                </td>
                <td className="py-2.5 pr-3">
                  <RankHistoryChart history={kw.history} />
                </td>
                <td className="py-2.5 pr-3 text-xs text-gray-400">
                  {last ? formatDate(last.date) : "never"}
                </td>
                <td className="py-2.5 flex items-center gap-1">
                  <button
                    onClick={() => onCheckKeyword(app.id, i)}
                    disabled={isChecking}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    aria-label={`Check rank for ${kw.keyword}`}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => onRemoveKeyword(app.id, i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove keyword ${kw.keyword}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
