// src/components/search-results.tsx
"use client";

import { AppCard } from "./app-card";
import { KeywordScores } from "./keyword-scores";
import { RelatedKeywords } from "./related-keywords";
import { SearchResponse } from "@/lib/types";

interface SearchResultsProps {
  data: SearchResponse;
  onRelatedTermClick: (term: string) => void;
  isFavorite?: (id: number) => boolean;
  onToggleFavorite?: (id: number) => void;
}

export function SearchResults({
  data,
  onRelatedTermClick,
  isFavorite,
  onToggleFavorite,
}: SearchResultsProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Results for <span className="font-semibold text-gray-900">&ldquo;{data.query}&rdquo;</span>
            {" "}· {data.total} apps · {data.country.toUpperCase()} store
          </p>
        </div>
        <KeywordScores scores={data.scores} />
      </div>

      <RelatedKeywords terms={data.relatedTerms} onSelect={onRelatedTermClick} />

      <div className="space-y-3">
        {data.results.map((app, i) => (
          <AppCard
            key={app.trackId}
            app={app}
            rank={i + 1}
            isFavorite={isFavorite?.(app.trackId)}
            onToggleFavorite={
              onToggleFavorite ? () => onToggleFavorite(app.trackId) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
