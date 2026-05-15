// src/components/tracked-app-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { TrackedApp } from "@/lib/tracker";
import { RankHistoryChart } from "@/components/rank-history-chart";
import { Package, Trash2, RefreshCw } from "lucide-react";

interface TrackedAppCardProps {
  app: TrackedApp;
  checking: Set<string>;
  onRemoveApp: (id: string) => void;
  onRemoveKeyword: (appId: string, keywordIndex: number) => void;
  onCheckKeyword: (appId: string, keywordIndex: number) => void;
  onCheckAll: (appId: string) => void;
}

function rankColor(rank: number | null): string {
  if (rank === null) return "text-gray-300";
  if (rank <= 5) return "bg-black text-white";
  if (rank <= 15) return "border-2 border-black";
  return "text-gray-300 border-2 border-gray-200";
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
    <div className="bg-white border-2 border-black p-5">
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
            className="border-2 border-black"
          />
          <div>
            <h3 className="font-bold">{app.trackName}</h3>
            <p className="text-xs font-medium text-gray-400">
              {app.keywords.length} keyword{app.keywords.length !== 1 ? "s" : ""} tracked
            </p>
            {app.version && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Package className="h-3 w-3" /> v{app.version}
                {app.lastVersionCheck && (
                  <span className="text-gray-300">· checked {formatDate(app.lastVersionCheck)}</span>
                )}
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCheckAll(app.id)}
            disabled={isCheckingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingAll ? "animate-spin" : ""}`} />
            {isCheckingAll ? "CHECKING..." : "CHECK ALL"}
          </button>
          <button
            onClick={() => onRemoveApp(app.id)}
            className="p-1.5 text-gray-300 hover:text-black transition-colors"
            aria-label="Remove app"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider border-b-2 border-black">
              <th className="pb-2 pr-3">Keyword</th>
              <th className="pb-2 pr-3">Country</th>
              <th className="pb-2 pr-3">Rank</th>
              <th className="pb-2 pr-3">Trend</th>
              <th className="pb-2 pr-3 w-20">History</th>
              <th className="pb-2 pr-3">Last check</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="font-medium">
            {app.keywords.map((kw, i) => {
              const last = kw.history[kw.history.length - 1];
              const isChecking = checking.has(`${app.id}:${i}`);
              return (
                <tr key={`${kw.keyword}-${kw.country}-${i}`} className="border-t border-gray-200">
                  <td className="py-2.5 pr-3 font-bold">{kw.keyword}</td>
                  <td className="py-2.5 pr-3 uppercase text-xs">{kw.country}</td>
                  <td className="py-2.5 pr-3">
                    {last ? (
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold tabular-nums ${rankColor(last.rank)}`}>
                        {last.rank ? `#${last.rank}` : "—"}
                      </span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-sm font-bold">
                    {last ? trendSymbol(kw.history) : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <RankHistoryChart history={kw.history} />
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-gray-400 font-medium">
                    {last ? formatDate(last.date) : "never"}
                  </td>
                  <td className="py-2.5 flex items-center gap-1">
                    <button
                      onClick={() => onCheckKeyword(app.id, i)}
                      disabled={isChecking}
                      className="p-1.5 text-gray-300 hover:text-black transition-colors disabled:opacity-50"
                      aria-label={`Check rank for ${kw.keyword}`}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => onRemoveKeyword(app.id, i)}
                      className="p-1.5 text-gray-300 hover:text-black transition-colors"
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
    </div>
  );
}
