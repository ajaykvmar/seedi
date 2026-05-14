// src/components/app-card.tsx
"use client";

import Image from "next/image";
import { Star, StarHalf } from "lucide-react";
import { AppResult } from "@/lib/types";

interface AppCardProps {
  app: AppResult;
  rank: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <StarHalf key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      );
    } else {
      stars.push(<Star key={i} className="h-3.5 w-3.5 text-gray-300" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
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
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-lg font-semibold text-gray-400">{rank}</span>
      </div>

      <div className="flex-shrink-0">
        <Image
          src={app.artworkUrl100}
          alt={app.trackName}
          width={64}
          height={64}
          className="rounded-xl"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{app.trackName}</h3>
        <p className="text-sm text-gray-500 truncate">{app.sellerName}</p>
        <div className="flex items-center gap-2 mt-1">
          <RatingStars rating={app.averageUserRating} />
          <span className="text-sm text-gray-500">
            {app.averageUserRating.toFixed(1)} · {formatCount(app.userRatingCount)}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {app.primaryGenreName} · {timeSince(app.releaseDate)}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        {onToggleFavorite && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`}
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">{app.formattedPrice}</span>
        <a
          href={app.trackViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 text-xs text-blue-600 hover:text-blue-700"
        >
          View on App Store →
        </a>
      </div>
    </div>
  );
}
