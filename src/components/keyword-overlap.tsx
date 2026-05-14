// src/components/keyword-overlap.tsx
"use client";

import { OverlapResult } from "@/lib/competitor-analysis";
import { AppResult } from "@/lib/types";
import Image from "next/image";

interface CompetitorEntry {
  app: AppResult;
  overlap: OverlapResult;
}

interface KeywordOverlapProps {
  competitors: CompetitorEntry[];
  keywords: string[];
}

export function KeywordOverlap({ competitors, keywords }: KeywordOverlapProps) {
  if (competitors.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Keyword Overlap with Competitors
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {keywords.length} category keywords analyzed · {competitors.length} competitors found
      </p>

      <div className="space-y-3">
        {competitors.map(({ app, overlap }) => (
          <div key={app.trackId} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100">
            <Image src={app.artworkUrl100} alt={app.trackName} width={44} height={44} className="rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">{app.trackName}</p>
              <p className="text-xs text-gray-500">{app.sellerName} · {app.averageUserRating.toFixed(1)} ★</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">{overlap.overlapPercentage}%</span>
              <p className="text-xs text-gray-400">{overlap.overlapCount} shared keywords</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
