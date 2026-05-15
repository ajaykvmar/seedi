// src/components/review-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
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
        <h2 className="text-sm font-semibold mb-4 border-b pb-2">
          Ratings &amp; Reviews
        </h2>
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  if (!data || data.totalReviews === 0) {
    return null;
  }

  const maxDist = Math.max(...Object.values(data.distribution), 1);

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-4 border-b pb-2">
        Ratings &amp; Reviews
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rating summary */}
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl font-bold tabular-nums">{data.averageRating}</span>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(data.averageRating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{data.totalReviews} reviews</span>
            </div>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = maxDist > 0 ? (data.distribution[star] / maxDist) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-right font-bold tabular-nums text-muted-foreground">{star}</span>
                  <div className="flex-1 h-3 rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">
                    {data.distribution[star]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Topic clusters */}
        <Card className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Topics
          </h3>
          {data.topics && data.topics.length > 0 ? (
            <div className="space-y-2">
              {data.topics.map((t) => (
                <div key={t.topic} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <span>{t.icon}</span>
                    <span className="capitalize font-medium">{t.topic === "missingFeature" ? "Missing Feature" : t.topic}</span>
                    {t.sampleReviews.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        — {t.sampleReviews[0].title.slice(0, 40)}
                      </span>
                    )}
                  </span>
                  <Badge variant="secondary" className="tabular-nums text-xs">
                    {t.count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
          {(!data.topics || data.topics.length === 0) && data.topWords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.topWords.slice(0, 20).map((w) => (
                <Badge key={w.word} variant="secondary">
                  {w.word}
                </Badge>
              ))}
            </div>
          )}
          {(!data.topics || data.topics.length === 0) && data.topWords.length === 0 && (
            <p className="text-xs text-muted-foreground">Not enough reviews to classify</p>
          )}
        </Card>
      </div>

      {/* Recent reviews */}
      {data.recentReviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recent Reviews
            {data.recentReviews.length > 5 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="ml-2"
              >
                {expanded ? "Show less" : `Show all ${data.recentReviews.length}`}
              </Button>
            )}
          </h3>
          <div className="space-y-3">
            {(expanded ? data.recentReviews : data.recentReviews.slice(0, 5)).map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.updated).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed line-clamp-3 text-muted-foreground">{review.content}</p>
                {review.version && (
                  <p className="text-xs text-muted-foreground/60 mt-1 font-mono">v{review.version}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
