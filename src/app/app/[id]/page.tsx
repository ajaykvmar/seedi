// src/app/app/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
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
        <div className="max-w-3xl mx-auto px-4 py-12 text-center font-bold">LOADING...</div>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="p-4 border-2 border-black bg-black text-white text-sm font-bold">
            {error || "App not found"}
          </div>
          <Link href="/" className="inline-flex items-center gap-1 mt-4 text-sm font-bold underline underline-offset-2">
            ← Back to search
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 mb-6 text-sm font-medium hover:underline underline-offset-2">
          ← Back to search
        </Link>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8 border-2 border-black p-5 bg-white">
          <Image
            src={app.artworkUrl100}
            alt={app.trackName}
            width={100}
            height={100}
            className="border-2 border-black"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black">{app.trackName}</h1>
            <p className="text-sm font-medium text-gray-500">{app.sellerName}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="font-bold tabular-nums">{app.averageUserRating.toFixed(1)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{formatCount(app.userRatingCount)} ratings</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{app.primaryGenreName}</span>
            </div>
            <a
              href={app.trackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-bold underline underline-offset-2"
            >
              View on App Store →
            </a>
          </div>
        </div>

        {/* Screenshots */}
        {app.screenshotUrls.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
              Screenshots
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {app.screenshotUrls.slice(0, 5).map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`${app.trackName} screenshot ${i + 1}`}
                  width={200}
                  height={433}
                  className="flex-shrink-0 border-2 border-black"
                />
              ))}
            </div>
          </section>
        )}

        {/* What's New */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
            What&rsquo;s New
          </h2>
          <div className="border-2 border-black p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Version {app.version ?? "N/A"}</span>
              {app.currentVersionReleaseDate && (
                <span className="text-xs font-medium text-gray-400">
                  {new Date(app.currentVersionReleaseDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {app.releaseNotes ? (
              <p className="text-sm leading-relaxed whitespace-pre-line font-medium">{app.releaseNotes}</p>
            ) : (
              <p className="text-sm text-gray-300 italic">No release notes available</p>
            )}
          </div>
        </section>

        {/* Description */}
        {app.description && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
              Description
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line font-medium">{app.description}</p>
          </section>
        )}

        {/* App Info Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
            App Info
          </h2>
          <div className="grid grid-cols-2 border-2 border-black">
            {[
              { label: "Version", value: app.version ?? "N/A" },
              { label: "Size", value: app.fileSizeBytes ? `${(parseInt(app.fileSizeBytes) / 1_048_576).toFixed(1)} MB` : "N/A" },
              { label: "Min. OS", value: app.minimumOsVersion ?? "N/A" },
              { label: "Languages", value: app.languageCodesISO2A?.length ? `${app.languageCodesISO2A.length} languages` : "N/A" },
            ].map((row, i) => (
              <div key={i} className={`flex flex-col p-3 ${i % 2 === 0 ? "border-r-2 border-black" : ""} ${i < 2 ? "border-b-2 border-black" : ""}`}>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{row.label}</span>
                <span className="font-bold mt-0.5">{row.value}</span>
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
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
              More by {app.sellerName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {developerApps.map((devApp) => (
                <Link
                  key={devApp.trackId}
                  href={`/app/${devApp.trackId}`}
                  className="flex flex-col items-center gap-2 p-3 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <Image
                    src={devApp.artworkUrl100}
                    alt={devApp.trackName}
                    width={56}
                    height={56}
                    className="border-2 border-black"
                  />
                  <span className="text-xs font-bold text-center line-clamp-2 leading-tight">
                    {devApp.trackName}
                  </span>
                  <span className="text-xs text-gray-400">{devApp.primaryGenreName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {app.genres.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {app.genres.map((genre, i) => (
                <span key={i} className="px-3 py-1 border-2 border-black text-sm font-bold">
                  {genre}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
