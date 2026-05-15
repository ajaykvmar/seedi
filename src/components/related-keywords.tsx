// src/components/related-keywords.tsx
"use client";

import { Badge } from "@/components/ui/badge";

interface RelatedKeywordsProps {
  terms: string[];
  onSelect: (term: string) => void;
}

export function RelatedKeywords({ terms, onSelect }: RelatedKeywordsProps) {
  if (terms.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Related Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, i) => (
          <Badge
            key={i}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-1.5"
            onClick={() => onSelect(term)}
          >
            {term}
          </Badge>
        ))}
      </div>
    </div>
  );
}
