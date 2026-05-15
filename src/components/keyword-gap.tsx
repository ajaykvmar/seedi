"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, X, Plus, Check } from "lucide-react";
import Link from "next/link";

interface GapData {
  app: { trackId: number; trackName: string };
  competitor: { trackId: number; trackName: string };
  overlap: { overlapCount: number; overlapPercentage: number; shared: string[] };
  onlyApp: string[];
  onlyComp: string[];
  appKeywordCount: number;
  compKeywordCount: number;
}

export function KeywordGap() {
  const [appUrl, setAppUrl] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract trackId from App Store URL or accept raw ID
  const extractId = (input: string): number | null => {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const match = trimmed.match(/\/id(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const doAnalysis = async () => {
    const appId = extractId(appUrl);
    const compId = extractId(compUrl);
    if (!appId || !compId) {
      setError("Enter valid App Store URLs or track IDs for both apps");
      return;
    }
    if (appId === compId) {
      setError("App and competitor must be different");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/gap?app=${appId}&competitor=${compId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Your App
          </label>
          <Input
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            placeholder="App Store URL or track ID"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Competitor
          </label>
          <Input
            value={compUrl}
            onChange={(e) => setCompUrl(e.target.value)}
            placeholder="App Store URL or track ID"
          />
        </div>
      </div>
      <Button
        onClick={doAnalysis}
        disabled={!appUrl.trim() || !compUrl.trim() || loading}
        className="mb-6 gap-1"
      >
        <ArrowLeftRight className="h-4 w-4" />
        {loading ? "Analyzing..." : "Compare Keywords"}
      </Button>

      {error && (
        <Card className="p-3 mb-4 bg-destructive text-destructive-foreground text-sm">{error}</Card>
      )}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.appKeywordCount}</p>
              <p className="text-xs text-muted-foreground">{data.app.trackName}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.overlap.overlapPercentage}%</p>
              <p className="text-xs text-muted-foreground">Overlap</p>
              <p className="text-xs text-muted-foreground">{data.overlap.overlapCount} shared keywords</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{data.compKeywordCount}</p>
              <p className="text-xs text-muted-foreground">{data.competitor.trackName}</p>
            </Card>
          </div>

          {/* Shared keywords */}
          {data.overlap.shared.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                Shared Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.overlap.shared.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Only in your app */}
          {data.onlyApp.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-blue-500" />
                Only in &ldquo;{data.app.trackName}&rdquo;
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.onlyApp.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Only in competitor */}
          {data.onlyComp.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <X className="h-4 w-4 text-red-400" />
                Only in &ldquo;{data.competitor.trackName}&rdquo; — You&rsquo;re missing:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.onlyComp.map((kw) => (
                  <Link key={kw} href={`/?q=${encodeURIComponent(kw)}`}>
                    <Badge variant="destructive" className="cursor-pointer hover:opacity-80">
                      {kw}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
