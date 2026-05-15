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

export interface TopicCluster {
  topic: string;
  icon: string;
  count: number;
  sentiment: "positive" | "negative" | "mixed";
  sampleReviews: { title: string; rating: number }[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: { [stars: number]: number };
  topWords: { word: string; count: number }[];
  recentReviews: Review[];
  topics?: TopicCluster[];
}

const TOPIC_PATTERNS: Record<string, { keywords: string[]; icon: string; sentiment: "positive" | "negative" | "mixed" }> = {
  crash: {
    keywords: ["crash", "crashes", "crashed", "crashing", "freeze", "freezes", "frozen", "bug", "glitch", "broken", "unstable", "not working", "doesn't work", "won't open", "keeps closing"],
    icon: "⚠️",
    sentiment: "negative",
  },
  performance: {
    keywords: ["slow", "lag", "lags", "laggy", "loading", "battery drain", "drains battery", "memory", "storage", "heavy", "stutter"],
    icon: "🐌",
    sentiment: "negative",
  },
  pricing: {
    keywords: ["subscription", "price", "pricing", "expensive", "too expensive", "overpriced", "cost", "pay", "paid", "premium", "subscription", "trial", "free trial", "auto renew", "cancel", "refund", "money", "worth", "value", "bait and switch", "hidden"],
    icon: "💰",
    sentiment: "negative",
  },
  ui: {
    keywords: ["interface", "ui", "ux", "design", "ugly", "layout", "confusing", "cluttered", "hard to use", "navigation", "menu", "button", "scroll", "responsive", "dark mode", "accessibility", "font", "color"],
    icon: "🎨",
    sentiment: "mixed",
  },
  missingFeature: {
    keywords: ["wish", "wished", "missing", "add", "please add", "would be great", "need", "needs", "feature request", "suggestion", "ability to", "option to", "support for", "integrate", "integration", "sync", "widget", "apple watch", "widget", "shortcut"],
    icon: "💡",
    sentiment: "mixed",
  },
  ads: {
    keywords: ["ads", "ad", "advertisement", "commercial", "spam", "notification spam", "too many ads", "annoying ads", "pop up", "popup"],
    icon: "📢",
    sentiment: "negative",
  },
  customerSupport: {
    keywords: ["support", "customer service", "help", "response", "reply", "contact", "email", "no response", "ignored", "unresponsive", "refund"],
    icon: "🎧",
    sentiment: "negative",
  },
  update: {
    keywords: ["update", "new version", "latest", "recent update", "old version", "downgrade", "used to", "before update", "after update", "ruined", "worse", "broke"],
    icon: "🔄",
    sentiment: "mixed",
  },
  privacy: {
    keywords: ["privacy", "data", "track", "tracking", "collect", "collects", "personal", "location", "permission", "access", "camera", "microphone", "contacts", "photos"],
    icon: "🔒",
    sentiment: "negative",
  },
};

export function classifyReviewTopics(reviews: Review[]): TopicCluster[] {
  const topicHits = new Map<string, { count: number; reviews: { title: string; rating: number }[] }>();

  for (const review of reviews) {
    const text = (review.title + " " + review.content).toLowerCase();
    for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
      const matched = config.keywords.some((kw) => text.includes(kw));
      if (matched) {
        if (!topicHits.has(topic)) {
          topicHits.set(topic, { count: 0, reviews: [] });
        }
        const entry = topicHits.get(topic)!;
        entry.count++;
        if (entry.reviews.length < 3) {
          entry.reviews.push({ title: review.title, rating: review.rating });
        }
      }
    }
  }

  return Array.from(topicHits.entries())
    .map(([topic, data]) => ({
      topic,
      icon: TOPIC_PATTERNS[topic].icon,
      count: data.count,
      sentiment: TOPIC_PATTERNS[topic].sentiment,
      sampleReviews: data.reviews,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
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

  const topics = classifyReviewTopics(allReviews);

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    distribution,
    topWords,
    topics,
    recentReviews: allReviews
      .sort(
        (a, b) =>
          new Date(b.updated).getTime() - new Date(a.updated).getTime()
      )
      .slice(0, 20),
  };
}
