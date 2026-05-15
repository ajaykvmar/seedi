// src/app/validate/page.tsx
"use client";

import { useState, useCallback, Suspense } from "react";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Lightbulb, TrendingUp, Users, Tag, GitFork, MessageSquare } from "lucide-react";

interface Signal {
  score: number;
  verdict: string;
  detail: string;
  value: string;
}

interface ValidateResponse {
  keyword: string;
  totalResults: number;
  signals: {
    titleGap: Signal;
    entryBarrier: Signal;
    freshness: Signal;
    keywordBreadth: Signal;
    competitorFragmentation: Signal;
    reviewPain: Signal;
  };
  overall: {
    score: number;
    verdict: string;
  };
}

function ValidateContent() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doValidate = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/validate?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Validation failed");
      }
      const json: ValidateResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const verdictColor = (v: string) => {
    switch (v) {
      case "pass": return { bg: "bg-green-100 text-green-800", label: "PASS" };
      case "warning": return { bg: "bg-amber-100 text-amber-800", label: "WARN" };
      case "fail": return { bg: "bg-red-100 text-red-800", label: "FAIL" };
      default: return { bg: "bg-gray-100 text-gray-600", label: "INFO" };
    }
  };

  const scoreColor = (s: number) => {
    if (s >= 70) return "text-green-600";
    if (s >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const signals = [
    { key: "titleGap" as const, icon: Tag, label: "Title Gap", desc: "Can you claim the keyword in your app name?" },
    { key: "entryBarrier" as const, icon: TrendingUp, label: "Entry Barrier", desc: "How many ratings #10 has" },
    { key: "freshness" as const, icon: Lightbulb, label: "Freshness", desc: "Are new apps ranking?" },
    { key: "keywordBreadth" as const, icon: Search, label: "Keyword Breadth", desc: "How many search angles exist" },
    { key: "competitorFragmentation" as const, icon: GitFork, label: "Competitor Fragmentation", desc: "Do competitors overlap?" },
    { key: "reviewPain" as const, icon: MessageSquare, label: "Review Pain", desc: "Common user complaints" },
  ];

  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Idea Validator</h1>
            <p className="text-sm text-muted-foreground">
              Enter a keyword to see if it&rsquo;s worth building for
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-xl mx-auto mb-8">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. workout tracker, photo editor..."
              onKeyDown={(e) => e.key === "Enter" && query.trim().length >= 2 && doValidate(query.trim())}
            />
            <Button
              onClick={() => doValidate(query.trim())}
              disabled={query.trim().length < 2 || loading}
            >
              {loading ? "Analyzing..." : "Validate"}
            </Button>
          </div>

          {error && (
            <Card className="max-w-xl mx-auto mb-6 p-3 bg-destructive text-destructive-foreground text-sm">
              {error}
            </Card>
          )}

          {loading && (
            <div className="max-w-xl mx-auto space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Overall */}
              <Card className={`max-w-md mx-auto mb-8 p-5 text-center ${scoreColor(data.overall.score)}`}>
                <p className="text-4xl font-bold mb-1">{data.overall.score}/100</p>
                <p className="text-lg font-medium capitalize">{data.overall.verdict}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {data.totalResults} apps for &ldquo;{data.keyword}&rdquo;
                </p>
              </Card>

              {/* Signals */}
              <div className="space-y-3">
                {signals.map(({ key, icon: Icon, label, desc }) => {
                  const s = data.signals[key];
                  const vc = verdictColor(s.verdict);
                  return (
                    <Card key={key} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm">{label}</span>
                            <Badge className={vc.bg}>{vc.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{desc}</p>
                          <p className="text-sm">{s.detail}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={`text-xl font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!data && !loading && !error && (
            <div className="text-center mt-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">Enter a keyword above to validate your app idea</p>
              <p className="text-xs mt-1 text-muted-foreground/50">
                We&rsquo;ll analyze title saturation, entry barrier, freshness, keyword breadth, competitor overlap, and review pain points
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={null}>
      <ValidateContent />
    </Suspense>
  );
}
