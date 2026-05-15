// src/components/chart-card.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChartApp } from "@/lib/charts";

interface ChartCardProps {
  app: ChartApp;
  rank: number;
}

export function ChartCard({ app, rank }: ChartCardProps) {
  const router = useRouter();

  return (
    <Card
      className="flex-row items-center gap-3 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/app/${app.id}`)}
    >
      <div className="flex-shrink-0 w-6 text-center">
        <span className="text-sm font-bold tabular-nums text-muted-foreground">{rank}</span>
      </div>

      <div className="flex-shrink-0">
        <Image
          src={app.artworkUrl100}
          alt={app.name}
          width={40}
          height={40}
          className="rounded-md border"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{app.name}</p>
        <p className="text-xs text-muted-foreground truncate">{app.artistName}</p>
      </div>

      <div className="flex-shrink-0">
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          App Store &nbsp;→
        </a>
      </div>
    </Card>
  );
}
