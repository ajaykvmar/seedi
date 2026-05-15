// src/components/tracked-app-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="p-5">
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
            className="rounded border"
          />
          <div>
            <h3 className="font-semibold">{app.trackName}</h3>
            <p className="text-xs text-muted-foreground">
              {app.keywords.length} keyword{app.keywords.length !== 1 ? "s" : ""} tracked
            </p>
            {app.version && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Package className="h-3 w-3" /> v{app.version}
                {app.lastVersionCheck && (
                  <span className="text-muted-foreground/50">· checked {formatDate(app.lastVersionCheck)}</span>
                )}
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCheckAll(app.id)}
            disabled={isCheckingAll}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isCheckingAll ? "animate-spin" : ""}`} />
            {isCheckingAll ? "Checking..." : "Check All"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveApp(app.id)}
            aria-label="Remove app"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
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
                <tr key={`${kw.keyword}-${kw.country}-${i}`} className="border-t border-border">
                  <td className="py-2.5 pr-3 font-medium">{kw.keyword}</td>
                  <td className="py-2.5 pr-3 uppercase text-xs">{kw.country}</td>
                  <td className="py-2.5 pr-3">
                    {last ? (
                      <Badge variant={last.rank && last.rank <= 5 ? "default" : last.rank && last.rank <= 15 ? "secondary" : "outline"}>
                        {last.rank ? `#${last.rank}` : "—"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-sm font-bold">
                    {last ? trendSymbol(kw.history) : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <RankHistoryChart history={kw.history} />
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                    {last ? formatDate(last.date) : "never"}
                  </td>
                  <td className="py-2.5 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCheckKeyword(app.id, i)}
                      disabled={isChecking}
                      aria-label={`Check rank for ${kw.keyword}`}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveKeyword(app.id, i)}
                      aria-label={`Remove keyword ${kw.keyword}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
