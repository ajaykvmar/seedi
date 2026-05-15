// src/components/related-keywords.tsx
"use client";

interface RelatedKeywordsProps {
  terms: string[];
  onSelect: (term: string) => void;
}

export function RelatedKeywords({ terms, onSelect }: RelatedKeywordsProps) {
  if (terms.length === 0) return null;

  return (
    <div className="border-2 border-black p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3">
        Related Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, i) => (
          <button
            key={i}
            onClick={() => onSelect(term)}
            className="px-3 py-1.5 border-2 border-black text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
