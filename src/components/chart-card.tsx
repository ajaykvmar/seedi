// src/components/chart-card.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChartApp } from "@/lib/charts";

interface ChartCardProps {
  app: ChartApp;
  rank: number;
}

export function ChartCard({ app, rank }: ChartCardProps) {
  const router = useRouter();

  return (
    <div
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => router.push(`/app/${app.id}`)}
    >
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-lg font-semibold text-gray-400">{rank}</span>
      </div>

      <div className="flex-shrink-0">
        <Image
          src={app.artworkUrl100}
          alt={app.name}
          width={64}
          height={64}
          className="rounded-xl"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
        <p className="text-sm text-gray-500 truncate">{app.artistName}</p>
        <p className="text-xs text-gray-400 mt-1">
          {app.releaseDate ? `Released ${new Date(app.releaseDate).toLocaleDateString()}` : ""}
        </p>
      </div>

      <div className="flex-shrink-0 self-center">
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          App Store →
        </a>
      </div>
    </div>
  );
}
