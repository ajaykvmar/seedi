// src/lib/keyword-extraction.ts
// ASO keyword extraction from App Store app TITLES (not descriptions).
// App titles carry the most keyword weight — developers embed their
// target phrases directly in the name. Descriptions add noise.

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "it", "its", "my", "your",
  "our", "their", "his", "her", "be", "are", "was", "were", "has", "have",
  "had", "do", "does", "did", "will", "would", "can", "could", "should",
  "may", "might", "shall", "all", "any", "each", "every", "no", "not",
  "only", "own", "same", "so", "than", "too", "very", "just", "also",
  "more", "most", "some", "such", "get", "got", "app", "apps", "free",
  "new", "now", "one", "use", "using", "used", "like", "make", "made",
  "way", "good", "best", "top", "great", "easy", "fast", "simple",
  "pro", "plus", "premium", "lite", "full", "mini", "max",
  "never", "ever", "always", "much", "many", "still", "yet", "already",
  "well", "back", "even", "still", "really", "quite", "pretty",
  "let", "set", "put", "take", "come", "go", "see", "know", "think",
  "want", "need", "try", "find", "keep", "start", "stop", "done",
  "within", "without", "across", "through", "during", "before", "after",
  "about", "between", "under", "over", "above", "below", "around",
  "vs", "v", "co", "com",
]);

// Title separators — app titles use these to delimit keyword phrases
const TITLE_SEPARATORS = /[\s\-–—:|/()\[\]{}•·,]+/;

function cleanToken(w: string): string {
  return w
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "");
}

function isValidToken(w: string): boolean {
  if (w.length < 2 || w.length > 25) return false;
  if (!/^[a-z0-9]/.test(w)) return false;
  if (/^\d+$/.test(w)) return false;
  if (STOP_WORDS.has(w)) return false;
  return true;
}

export function extractKeywordsFromTexts(
  texts: string[],
  excludeQuery: string = ""
): string[] {
  const phraseCounts = new Map<string, number>();
  const excludeWords = new Set(
    excludeQuery.toLowerCase().split(/\s+/).filter((w) => w.length >= 2)
  );

  for (const text of texts) {
    // Split the title into segments by separators
    // Each segment is typically a keyword phrase like "Workout Tracker"
    const segments = text.split(TITLE_SEPARATORS).filter(Boolean);

    // Track unique phrases per title to avoid inflation from long app names
    const seen = new Set<string>();

    for (const segment of segments) {
      const cleaned = cleanToken(segment);
      if (!cleaned || cleaned.length < 2) continue;
      if (excludeWords.has(cleaned)) continue;

      // The whole segment as a keyword phrase (e.g. "workout tracker")
      if (cleaned.length >= 4 && cleaned.includes(" ") && !seen.has(cleaned)) {
        seen.add(cleaned);
        phraseCounts.set(cleaned, (phraseCounts.get(cleaned) || 0) + 3);
      }

      // Individual words from the segment
      const words = cleaned.split(/\s+/).filter(isValidToken);
      for (const word of words) {
        if (excludeWords.has(word)) continue;
        if (!seen.has(word)) {
          seen.add(word);
          phraseCounts.set(word, (phraseCounts.get(word) || 0) + 1);
        }
      }
    }

    // Also extract bigrams from consecutive words in the full title
    // This catches phrases split across separators
    const allWords = text
      .toLowerCase()
      .split(TITLE_SEPARATORS)
      .flatMap((s) => s.split(/\s+/))
      .map(cleanToken)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

    const bigramSeen = new Set<string>();
    for (let i = 0; i < allWords.length - 1; i++) {
      const w1 = allWords[i];
      const w2 = allWords[i + 1];
      if (excludeWords.has(w1) || excludeWords.has(w2)) continue;
      const phrase = `${w1} ${w2}`;
      if (!bigramSeen.has(phrase)) {
        bigramSeen.add(phrase);
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 2);
      }
    }
  }

  if (phraseCounts.size === 0) return [];

  const minScore = texts.length >= 5 ? 2 : 1;

  return [...phraseCounts.entries()]
    .filter(([, score]) => score >= minScore)
    .sort((a, b) => {
      // Sort by score descending
      if (b[1] !== a[1]) return b[1] - a[1];
      // Phrases with spaces (multi-word) rank higher than single words
      const aMulti = a[0].includes(" ") ? 1 : 0;
      const bMulti = b[0].includes(" ") ? 1 : 0;
      if (bMulti !== aMulti) return bMulti - aMulti;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 25)
    .map(([phrase]) => phrase);
}
