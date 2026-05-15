// src/components/review-section.tsx
"use client";

import { useState, useEffect } from "react";
import { type ReviewSummary } from "@/lib/reviews";

interface ReviewSectionProps {
  trackId: number;
}

export function ReviewSection({ trackId }: ReviewSectionProps) {
  const [data, setData] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?id=${trackId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [trackId]);

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
          Ratings &amp; Reviews
        </h2>
        <div className="text-sm font-bold text-gray-300">LOADING REVIEWS...</div>
      </section>
    );
  }

  if (!data || data.totalReviews === 0) {
    return null;
  }

  const maxDist = Math.max(...Object.values(data.distribution), 1);

  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
        Ratings &amp; Reviews
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rating summary */}
        <div className="border-2 border-black p-5">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl font-black tabular-nums">{data.averageRating}</span>
            <div>
              <div className="flex gap-0.5 text-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(data.averageRating) ? "" : "opacity-20"}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-400">{data.totalReviews} reviews</span>
            </div>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = maxDist > 0 ? (data.distribution[star] / maxDist) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-right font-bold tabular-nums">{star}</span>
                  <div className="flex-1 h-3 bg-gray-100 border border-black">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-gray-400 tabular-nums">
                    {data.distribution[star]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top words */}
        <div className="border-2 border-black p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Common Words</h3>
          <div className="flex flex-wrap gap-2">
            {data.topWords.slice(0, 20).map((w) => (
              <span
                key={w.word}
                className="px-2.5 py-1 border-2 border-black text-xs font-bold"
              >
                {w.word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent reviews */}
      {data.recentReviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3">
            Recent Reviews
            {data.recentReviews.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-2 underline underline-offset-2 font-bold normal-case"
              >
                {expanded ? "Show less" : `Show all ${data.recentReviews.length}`}
              </button>
            )}
          </h3>
          <div className="space-y-3">
            {(expanded ? data.recentReviews : data.recentReviews.slice(0, 5)).map((review) => (
              <div key={review.id} className="border-2 border-black p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? "" : "opacity-20"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-bold">{review.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.updated).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed line-clamp-3">{review.content}</p>
                {review.version && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">v{review.version}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
