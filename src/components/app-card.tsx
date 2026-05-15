// src/components/app-card.tsx
"use client";

import Image from "next/image";
import { AppResult } from "@/lib/types";

interface AppCardProps {
  app: AppResult;
  rank: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ${months % 12}mo`;
}

export function AppCard({ app, rank, isFavorite, onToggleFavorite }: AppCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border-2 border-black hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-lg font-bold tabular-nums">{rank}</span>
      </div>

      <div className="flex-shrink-0">
        <Image
          src={app.artworkUrl100}
          alt={app.trackName}
          width={64}
          height={64}
          className="border-2 border-black"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold truncate">{app.trackName}</h3>
        <p className="text-sm text-gray-500 truncate">{app.sellerName}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold tabular-nums">{app.averageUserRating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">· {formatCount(app.userRatingCount)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {app.primaryGenreName} · {timeSince(app.releaseDate)}
        </p>
      </div>

      <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`text-xs font-bold px-2 py-1 border-2 ${
              isFavorite
                ? "bg-black text-white border-black"
                : "border-black hover:bg-black hover:text-white"
            } transition-colors`}
          >
            {isFavorite ? "SAVED" : "SAVE"}
          </button>
        )}
        <span className="text-sm font-bold tabular-nums">{app.formattedPrice}</span>
        <a
          href={app.trackViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline underline-offset-2"
        >
          App Store →
        </a>
      </div>
    </div>
  );
}
