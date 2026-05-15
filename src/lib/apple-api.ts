// src/lib/apple-api.ts
import { AppResult } from "./types";

interface ItunesSearchResponse {
  resultCount: number;
  results: Record<string, unknown>[];
}

const ITUNES_SEARCH = "https://itunes.apple.com/search";
const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";

export async function searchApps(
  term: string,
  country = "us",
  limit = 25
): Promise<AppResult[]> {
  const url = new URL(ITUNES_SEARCH);
  url.searchParams.set("term", term);
  url.searchParams.set("entity", "software");
  url.searchParams.set("country", country);
  url.searchParams.set("limit", String(Math.min(limit, 50)));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const data: ItunesSearchResponse = await res.json();
  return data.results
    .filter((item) => (item.wrapperType as string) === "software")
    .map(normalize);
}

export async function lookupApp(
  trackId: number,
  country = "us"
): Promise<AppResult | null> {
  const url = new URL(ITUNES_LOOKUP);
  url.searchParams.set("id", String(trackId));
  url.searchParams.set("country", country);
  url.searchParams.set("entity", "software");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const data: ItunesSearchResponse = await res.json();
  if (data.resultCount === 0) return null;
  return normalize(data.results[0]);
}

export async function lookupDeveloper(
  artistId: number,
  country = "us"
): Promise<AppResult[]> {
  const url = new URL(ITUNES_LOOKUP);
  url.searchParams.set("id", String(artistId));
  url.searchParams.set("entity", "software");
  url.searchParams.set("country", country);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const data: ItunesSearchResponse = await res.json();
  return data.results
    .filter((item) => (item.wrapperType as string) === "software")
    .map(normalize);
}

function normalize(item: Record<string, unknown>): AppResult {
  return {
    trackId: item.trackId as number,
    trackName: (item.trackName as string) ?? "",
    description: item.description as string | undefined,
    releaseNotes: item.releaseNotes as string | undefined,
    currentVersionReleaseDate: item.currentVersionReleaseDate as string | undefined,
    averageUserRating: (item.averageUserRating as number) ?? 0,
    userRatingCount: (item.userRatingCount as number) ?? 0,
    releaseDate: item.releaseDate as string,
    artworkUrl100: item.artworkUrl100 as string,
    artworkUrl512: item.artworkUrl512 as string | undefined,
    primaryGenreName: (item.primaryGenreName as string) ?? "Unknown",
    genres: (item.genres as string[]) ?? [],
    sellerName: (item.sellerName as string) ?? "Unknown",
    sellerUrl: item.sellerUrl as string | undefined,
    artistId: item.artistId as number | undefined,
    price: (item.price as number) ?? 0,
    formattedPrice: (item.formattedPrice as string) ?? "Free",
    currency: item.currency as string,
    screenshotUrls: (item.screenshotUrls as string[]) ?? [],
    trackViewUrl: item.trackViewUrl as string,
    minimumOsVersion: item.minimumOsVersion as string | undefined,
    languageCodesISO2A: item.languageCodesISO2A as string[] | undefined,
    fileSizeBytes: item.fileSizeBytes as string | undefined,
    version: item.version as string | undefined,
  };
}
