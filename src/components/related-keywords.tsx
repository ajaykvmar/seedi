// src/components/related-keywords.tsx
"use client";

interface RelatedKeywordsProps {
  terms: string[];
  onSelect: (term: string) => void;
}

export function RelatedKeywords({ terms, onSelect }: RelatedKeywordsProps) {
  if (terms.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Related Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, i) => (
          <button
            key={i}
            onClick={() => onSelect(term)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm text-gray-700 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
