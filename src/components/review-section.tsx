// src/components/review-section.tsx
"use client";

import { useState, useEffect } from "react";
import { type ReviewSummary } from "@/lib/reviews";
import { Star } from "lucide-react";

interface ReviewSectionProps {
  trackId: number;
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${className ?? "bg-blue-500"}`} style={{ width: `${pct}%` }} />
    </div>
  );
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
        // silently fail - reviews are optional
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [trackId]);

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ratings & Reviews</h2>
        <div className="text-sm text-gray-400">Loading reviews...</div>
      </section>
    );
  }

  if (!data || data.totalReviews === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ratings & Reviews</h2>
        <div className="text-sm text-gray-400">No reviews data available</div>
      </section>
    );
  }

  const maxDist = Math.max(...Object.values(data.distribution), 1);

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ratings & Reviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating summary */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">{data.averageRating}</span>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(data.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">{data.totalReviews} reviews</span>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-500 text-xs text-right">{star} ★</span>
                <Bar value={data.distribution[star]} max={maxDist} className={
                  star >= 4 ? "bg-green-500" : star >= 3 ? "bg-yellow-400" : "bg-red-400"
                } />
                <span className="w-8 text-gray-400 text-xs">{data.distribution[star]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top words */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Words in Reviews</h3>
          <div className="flex flex-wrap gap-2">
            {data.topWords.slice(0, 20).map((w) => (
              <span
                key={w.word}
                className="px-2.5 py-1 bg-white rounded-full text-xs text-gray-700 border border-gray-200"
                title={`${w.count} occurrences`}
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Recent Reviews {data.recentReviews.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-700 font-normal ml-2"
              >
                {expanded ? "Show less" : `Show all ${data.recentReviews.length}`}
              </button>
            )}
          </h3>
          <div className="space-y-3">
            {(expanded ? data.recentReviews : data.recentReviews.slice(0, 5)).map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.updated).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{review.content}</p>
                {review.version && (
                  <p className="text-xs text-gray-400 mt-1">v{review.version}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
