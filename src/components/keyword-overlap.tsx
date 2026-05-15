// src/components/keyword-overlap.tsx
"use client";

import { AppResult } from "@/lib/types";
import Image from "next/image";

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
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
        Keyword Overlap
      </h2>
      <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
        {keywords.length} category keywords · {competitors.length} competitors
      </p>

      <div className="space-y-3">
        {competitors.map(({ app, overlap }) => (
          <div key={app.trackId} className="flex items-center gap-4 p-3 border-2 border-black">
            <Image src={app.artworkUrl100} alt={app.trackName} width={44} height={44} className="border-2 border-black" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-sm">{app.trackName}</p>
              <p className="text-xs font-medium text-gray-400">{app.sellerName} · {app.averageUserRating.toFixed(1)} ★</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-black">{overlap.overlapPercentage}%</span>
              <p className="text-xs font-medium text-gray-400">{overlap.overlapCount} shared</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
