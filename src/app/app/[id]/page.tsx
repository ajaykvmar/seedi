// src/app/app/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { AppResult } from "@/lib/types";
import { Star, ExternalLink, ChevronLeft } from "lucide-react";
import { KeywordOverlap } from "@/components/keyword-overlap";
import { ReviewSection } from "@/components/review-section";

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

        // Fetch competitor analysis in parallel
        const compRes = await fetch(`/api/competitor?id=${encodeURIComponent(id)}`);
        if (compRes.ok) {
          const compData = await compRes.json();
          setCompetitorData({ keywords: compData.keywords, competitors: compData.competitors });
        }

        // Fetch developer portfolio
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
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error || "App not found"}
          </div>
          <Link href="/" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700">
            <ChevronLeft className="h-4 w-4" /> Back to search
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 mb-6 text-sm text-gray-500 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Back to search
        </Link>

        <div className="flex items-start gap-5 mb-8">
          <Image
            src={app.artworkUrl100}
            alt={app.trackName}
            width={100}
            height={100}
            className="rounded-2xl shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{app.trackName}</h1>
            <p className="text-gray-500">{app.sellerName}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900">{app.averageUserRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{formatCount(app.userRatingCount)} ratings</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{app.primaryGenreName}</span>
            </div>
            <a
              href={app.trackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View on App Store
            </a>
          </div>
        </div>

        {app.screenshotUrls.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Screenshots</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {app.screenshotUrls.slice(0, 5).map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`${app.trackName} screenshot ${i + 1}`}
                  width={200}
                  height={433}
                  className="rounded-xl flex-shrink-0 border border-gray-200"
                />
              ))}
            </div>
          </section>
        )}

        {app.description && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{app.description}</p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">App Info</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-gray-500">Version</dt>
              <dd className="font-medium text-gray-900">{app.version ?? "N/A"}</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-gray-500">Size</dt>
              <dd className="font-medium text-gray-900">
                {app.fileSizeBytes ? `${(parseInt(app.fileSizeBytes) / 1_048_576).toFixed(1)} MB` : "N/A"}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-gray-500">Min. OS</dt>
              <dd className="font-medium text-gray-900">{app.minimumOsVersion ?? "N/A"}</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-gray-500">Languages</dt>
              <dd className="font-medium text-gray-900">
                {app.languageCodesISO2A?.length ? `${app.languageCodesISO2A.length} languages` : "N/A"}
              </dd>
            </div>
          </dl>
        </section>

        <ReviewSection trackId={app.trackId} />

        {competitorData && (
          <KeywordOverlap competitors={competitorData.competitors} keywords={competitorData.keywords} />
        )}

        {developerApps && developerApps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">More by {app.sellerName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {developerApps.map((devApp) => (
                <Link
                  key={devApp.trackId}
                  href={`/app/${devApp.trackId}`}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src={devApp.artworkUrl100}
                    alt={devApp.trackName}
                    width={56}
                    height={56}
                    className="rounded-xl"
                  />
                  <span className="text-xs text-gray-700 text-center line-clamp-2 leading-tight">
                    {devApp.trackName}
                  </span>
                  <span className="text-xs text-gray-400">{devApp.primaryGenreName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {app.genres.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {app.genres.map((genre, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">{genre}</span>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
