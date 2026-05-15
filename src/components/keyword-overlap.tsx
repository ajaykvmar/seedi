// src/components/keyword-overlap.tsx
"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { AppResult } from "@/lib/types";

interface CompetitorEntry {
  app: AppResult;
  overlap: { overlapCount: number; overlapPercentage: number; shared: string[] };
}

interface KeywordOverlapProps {
  competitors: CompetitorEntry[];
  keywords: string[];
}

export function KeywordOverlap({ competitors, keywords }: KeywordOverlapProps) {
  if (competitors.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-4 border-b pb-2">Keyword Overlap</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {keywords.length} category keywords · {competitors.length} competitors
      </p>

      <div className="space-y-2">
        {competitors.map(({ app, overlap }) => (
          <Card key={app.trackId} className="flex-row items-center gap-3 p-2.5">
            <Image src={app.artworkUrl100} alt={app.trackName} width={32} height={32} className="rounded border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{app.trackName}</p>
              <p className="text-xs text-muted-foreground truncate">{app.sellerName} · {app.averageUserRating.toFixed(1)} ★</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-bold">{overlap.overlapPercentage}%</span>
              <p className="text-[10px] text-muted-foreground">{overlap.overlapCount} shared</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
