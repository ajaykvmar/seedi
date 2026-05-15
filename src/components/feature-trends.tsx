"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FeatureMention {
  keyword: string;
  count: number;
  apps: string[];
  category: "feature" | "improvement" | "integration" | "platform";
}

interface FeaturesResponse {
  features: FeatureMention[];
  total: number;
  sourceCount: number;
  query: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  feature: "bg-blue-100 text-blue-800",
  improvement: "bg-green-100 text-green-800",
  integration: "bg-purple-100 text-purple-800",
  platform: "bg-amber-100 text-amber-800",
};

export function FeatureTrends() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<FeaturesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/features?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to load features");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. workout tracker, photo editor..."
          onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
          className="max-w-md"
        />
        <Button onClick={() => doSearch(query)} disabled={query.trim().length < 2 || loading}>
          {loading ? "Loading..." : "Analyze"}
        </Button>
      </div>

      {error && (
        <Card className="p-3 mb-4 bg-destructive text-destructive-foreground text-sm">{error}</Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Feature mentions extracted from release notes of top {data.sourceCount} apps for &ldquo;{data.query}&rdquo;
          </p>
          <div className="space-y-2">
            {data.features.map((f, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{f.keyword}</span>
                  <Badge className={CATEGORY_COLORS[f.category] || "bg-gray-100 text-gray-700"}>
                    {f.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {f.count} app{f.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {data.features.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No common feature patterns found in release notes
            </p>
          )}
        </>
      )}
    </div>
  );
}
