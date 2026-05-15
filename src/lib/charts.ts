// src/lib/charts.ts
export type FeedType = "top-free" | "top-paid";

export interface ChartApp {
  artistName: string;
  id: string;
  name: string;
  releaseDate: string;
  artworkUrl100: string;
  genres: string[];
  url: string;
}

export interface ChartFeed {
  title: string;
  updated: string;
  country: string;
  results: ChartApp[];
}

export async function getChart(
  country: string,
  feed: FeedType,
  limit: number
): Promise<ChartFeed> {
  const clamped = Math.max(10, Math.min(limit, 100));
  const url = `https://rss.marketingtools.apple.com/api/v2/${country}/apps/${feed}/${clamped}/apps.json`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`RSS feed error: ${res.status}`);
  }

  const data: { feed: ChartFeed } = await res.json();
  return data.feed;
}
