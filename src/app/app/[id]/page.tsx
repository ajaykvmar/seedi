// src/app/app/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { AppResult } from "@/lib/types";
import { ReviewSection } from "@/components/review-section";
import { KeywordOverlap } from "@/components/keyword-overlap";

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [app, setApp] = useState<AppResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [competitorData, setCompetitorData] = useState<{
    keywords: string[];
    competitors: { app: AppResult; overlap: { overlapCount: number; overlapPercentage: number; shared: string[] } }[];
  } | null>(null);
  const [developerApps, setDeveloperApps] = useState<AppResult[] | null>(null);

  useEffect(() => {
    async function fetchApp() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/app-info?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load app");
        }
        const data: AppResult = await res.json();
        setApp(data);

        const compRes = await fetch(`/api/competitor?id=${encodeURIComponent(id)}`);
        if (compRes.ok) {
          const compData = await compRes.json();
          setCompetitorData({ keywords: compData.keywords, competitors: compData.competitors });
        }

        if (data.artistId) {
          const devRes = await fetch(`/api/developer?id=${data.artistId}&country=${"us"}`);
          if (devRes.ok) {
            const devData = await devRes.json();
            setDeveloperApps(devData.apps.filter((a: AppResult) => a.trackId !== data.trackId).slice(0, 10));
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load app");
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="flex gap-5 mb-8">
            <Skeleton className="h-[100px] w-[100px]" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="p-4 bg-destructive text-destructive-foreground">
            <p className="text-sm font-medium">{error || "App not found"}</p>
          </Card>
          <Link href="/" className={buttonVariants({ variant: "link", className: "mt-4 gap-1" })}>
              <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className={buttonVariants({ variant: "link", className: "mb-6 -ml-3 gap-1" })}>
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>

        {/* Header */}
        <Card className="flex-row items-start gap-5 p-5 mb-8">
          <Image
            src={app.artworkUrl100}
            alt={app.trackName}
            width={100}
            height={100}
            className="rounded-lg border"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{app.trackName}</h1>
            <p className="text-sm text-muted-foreground">{app.sellerName}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="font-bold tabular-nums">{app.averageUserRating.toFixed(1)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatCount(app.userRatingCount)} ratings</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{app.primaryGenreName}</span>
            </div>
            <a href={app.trackViewUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "link", size: "sm", className: "mt-1 -ml-3 gap-1" })}>
                View on App Store <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>

        {/* Screenshots */}
        {app.screenshotUrls.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">Screenshots</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {app.screenshotUrls.slice(0, 5).map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`${app.trackName} screenshot ${i + 1}`}
                  width={200}
                  height={433}
                  className="flex-shrink-0 rounded-md border"
                />
              ))}
            </div>
          </section>
        )}

        {/* What's New */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 border-b pb-2">What&rsquo;s New</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Version {app.version ?? "N/A"}</span>
              {app.currentVersionReleaseDate && (
                <span className="text-xs text-muted-foreground">
                  {new Date(app.currentVersionReleaseDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {app.releaseNotes ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{app.releaseNotes}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No release notes available</p>
            )}
          </Card>
        </section>

        {/* Description */}
        {app.description && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">Description</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">{app.description}</p>
          </section>
        )}

        {/* App Info Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 border-b pb-2">App Info</h2>
          <div className="grid grid-cols-2 border rounded-lg overflow-hidden">
            {[
              { label: "Version", value: app.version ?? "N/A" },
              { label: "Size", value: app.fileSizeBytes ? `${(parseInt(app.fileSizeBytes) / 1_048_576).toFixed(1)} MB` : "N/A" },
              { label: "Min. OS", value: app.minimumOsVersion ?? "N/A" },
              { label: "Languages", value: app.languageCodesISO2A?.length ? `${app.languageCodesISO2A.length} languages` : "N/A" },
            ].map((row, i) => (
              <div key={i} className={`flex flex-col p-3 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""} bg-card`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</span>
                <span className="font-medium mt-0.5">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <ReviewSection trackId={app.trackId} />

        {/* Competitors */}
        {competitorData && (
          <KeywordOverlap competitors={competitorData.competitors} keywords={competitorData.keywords} />
        )}

        {/* Developer Portfolio */}
        {developerApps && developerApps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">
              More by {app.sellerName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {developerApps.map((devApp) => (
                <Link
                  key={devApp.trackId}
                  href={`/app/${devApp.trackId}`}
                >
                  <Card className="flex flex-col items-center gap-2 p-3 hover:bg-accent/50 transition-colors">
                    <Image
                      src={devApp.artworkUrl100}
                      alt={devApp.trackName}
                      width={56}
                      height={56}
                      className="rounded-md border"
                    />
                    <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                      {devApp.trackName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{devApp.primaryGenreName}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {app.genres.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {app.genres.map((genre, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => router.push(`/?q=${encodeURIComponent(genre)}`)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Related Keywords */}
        {competitorData && competitorData.keywords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">Related Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {competitorData.keywords.map((kw, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => router.push(`/?q=${encodeURIComponent(kw)}`)}
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
