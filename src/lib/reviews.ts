// src/lib/reviews.ts
import { XMLParser } from "fast-xml-parser";

export interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  voteSum: number;
  voteCount: number;
  version: string;
  updated: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: { [stars: number]: number };
  topWords: { word: string; count: number }[];
  recentReviews: Review[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const REVIEW_URL =
  "https://itunes.apple.com/rss/customerreviews/page={page}/id={trackId}/sortby=mostrecent/xml";

function parseReviewEntry(entry: any): Review | null {
  if (!entry || !entry.id) return null;

  // content can be a string, object ({#text, @_type}), or array of such objects
  const rawContent = entry.content;
  let contentText = "";
  if (typeof rawContent === "string") {
    contentText = rawContent;
  } else if (Array.isArray(rawContent)) {
    const textPart = rawContent.find(
      (c: any) => c?.["@_type"] === "text"
    );
    contentText = textPart?.["#text"] ?? rawContent[0]?.["#text"] ?? "";
  } else if (rawContent && typeof rawContent === "object") {
    contentText = rawContent["#text"] ?? "";
  }

  // title can also be an object with #text
  const rawTitle = entry.title;
  let titleText = "";
  if (typeof rawTitle === "string") {
    titleText = rawTitle;
  } else if (rawTitle && typeof rawTitle === "object") {
    titleText = rawTitle["#text"] ?? "";
  }

  return {
    id: String(entry.id),
    title: titleText,
    content: contentText,
    rating: parseInt(entry["im:rating"] ?? "0", 10),
    voteSum: parseInt(entry["im:voteSum"] ?? "0", 10),
    voteCount: parseInt(entry["im:voteCount"] ?? "0", 10),
    version: entry["im:version"] || "",
    updated: entry.updated || "",
  };
}

export async function getReviews(
  trackId: number,
  maxPages = 3
): Promise<ReviewSummary> {
  const allReviews: Review[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = REVIEW_URL.replace("{page}", String(page)).replace(
      "{trackId}",
      String(trackId)
    );

    try {
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404 && page > 1) break; // no more pages
        continue;
      }

      const xml = await res.text();
      const parsed = parser.parse(xml);

      const entries = parsed?.feed?.entry;
      if (!entries) break;

      const batch = Array.isArray(entries)
        ? entries.map(parseReviewEntry).filter(Boolean) as Review[]
        : [parseReviewEntry(entries)].filter(Boolean) as Review[];

      allReviews.push(...batch);

      if (batch.length < 50) break; // last page
    } catch {
      break; // network error, stop fetching more pages
    }
  }

  // Compute summary
  const totalReviews = allReviews.length;
  const averageRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const distribution: { [stars: number]: number } = {};
  for (let i = 1; i <= 5; i++) distribution[i] = 0;
  for (const r of allReviews) {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
  }

  // Extract most common words from review content (simple approach)
  const wordCounts = new Map<string, number>();
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "it", "its", "it's", "i", "my", "me", "we", "our", "you", "your",
    "he", "she", "they", "them", "this", "that", "these", "those",
    "not", "no", "nor", "so", "very", "just", "also", "too", "as",
    "if", "then", "else", "when", "where", "why", "how", "what",
    "which", "who", "whom", "all", "each", "every", "both", "few",
    "more", "most", "some", "any", "such", "only", "own", "same",
    "up", "down", "out", "off", "over", "about", "into", "through",
    "back", "after", "before", "between", "app", "use", "get", "got",
    "like", "time", "one", "two", "new", "now", "than", "then",
    "been", "much", "really", "please", "make", "doesn't", "don't",
  ]);

  for (const review of allReviews) {
    const words = (review.content + " " + review.title)
      .toLowerCase()
      .replace(/[^a-z\s']/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  const topWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    distribution,
    topWords,
    recentReviews: allReviews
      .sort(
        (a, b) =>
          new Date(b.updated).getTime() - new Date(a.updated).getTime()
      )
      .slice(0, 20),
  };
}
