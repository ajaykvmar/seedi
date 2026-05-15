// src/components/app-card.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";
import { AppResult } from "@/lib/types";

interface AppCardProps {
  app: AppResult;
  rank: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  clickable?: boolean;
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

export function AppCard({ app, rank, isFavorite, onToggleFavorite, clickable = true }: AppCardProps) {
  const router = useRouter();

  return (
    <Card
      className={clickable ? "hover:bg-accent/50 cursor-pointer transition-colors" : ""}
      onClick={clickable ? () => router.push(`/app/${app.trackId}`) : undefined}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0 w-8 text-center">
          <span className="text-lg font-bold tabular-nums text-muted-foreground">{rank}</span>
        </div>

        <div className="flex-shrink-0">
          <Image
            src={app.artworkUrl100}
            alt={app.trackName}
            width={64}
            height={64}
            className="rounded-md border"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{app.trackName}</h3>
          <p className="text-sm text-muted-foreground truncate">{app.sellerName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold tabular-nums">{app.averageUserRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">· {formatCount(app.userRatingCount)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {app.primaryGenreName} · {timeSince(app.releaseDate)}
          </p>
        </div>

        <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
          {onToggleFavorite && (
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite();
                }}
            >
              <Heart className={`h-3.5 w-3.5 mr-1 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Saved" : "Save"}
            </Button>
          )}
          <span className="text-sm font-bold tabular-nums">{app.formattedPrice}</span>
          <a
            href={app.trackViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={buttonVariants({ variant: "link", size: "sm", className: "gap-1" })}
          >
            App Store <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
