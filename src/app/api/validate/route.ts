// src/app/api/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchApps, lookupApp } from "@/lib/apple-api";
import { findCategoryKeywords, computeOverlap } from "@/lib/competitor-analysis";
import { getReviews } from "@/lib/reviews";
import { extractKeywordsFromTexts } from "@/lib/keyword-extraction";

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for",
  "of","with","by","from","is","are","was","were","be","been",
  "have","has","had","do","does","did","will","would",
  "could","should","may","might","shall","can","it","its",
  "i","my","me","we","our","you","your","he","she","they",
  "them","this","that","these","those","not","no","nor","so",
  "very","just","also","too","if","then","else","when",
  "which","who","all","each","every","both","few",
  "more","most","some","any","such","only","own","same",
  "up","down","out","off","over","about","into","through",
  "back","after","before","between","app","use","get","got",
  "like","time","one","two","new","now","than","then",
  "been","much","really","please","make",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get("q");

  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ error: "Keyword required (min 2 chars)" }, { status: 400 });
  }

  const q = keyword.trim().toLowerCase();
  const country = searchParams.get("country") || "us";

  try {
    // ── Fetch data ──
    const results = await searchApps(q, country, 50);
    if (results.length === 0) {
      return NextResponse.json({ error: "No results found for this keyword" }, { status: 404 });
    }

    const top10 = results.slice(0, 10);
    const top25 = results.slice(0, 25);

    // ── Signal 1: Title Gap ──
    const queryWords = q.split(/\s+/).filter((w) => w.length >= 3);
    const titleMatchCount = top10.filter((a) =>
      queryWords.some((w) => a.trackName.toLowerCase().includes(w))
    ).length;
    const titleGapRatio = 1 - titleMatchCount / 10;
    let titleGapVerdict: string;
    let titleGapDetail: string;
    if (titleGapRatio >= 0.7) {
      titleGapVerdict = "pass";
      titleGapDetail = `${titleMatchCount}/10 top apps have "${q}" in their name. You can claim it.`;
    } else if (titleGapRatio >= 0.3) {
      titleGapVerdict = "warning";
      titleGapDetail = `${titleMatchCount}/10 top apps target "${q}" in their name. Some room but not wide open.`;
    } else {
      titleGapVerdict = "fail";
      titleGapDetail = `${titleMatchCount}/10 top apps already have "${q}" in their name. Saturated.`;
    }

    // ── Signal 2: Entry Barrier ──
    const tenthApp = top10[top10.length - 1];
    const barrierRatings = tenthApp?.userRatingCount ?? 0;
    let barrierVerdict: string;
    let barrierDetail: string;
    if (barrierRatings < 500) {
      barrierVerdict = "pass";
      barrierDetail = `#10 app has ${barrierRatings} ratings. Low bar to enter top 10.`;
    } else if (barrierRatings < 10000) {
      barrierVerdict = "warning";
      barrierDetail = `#10 app has ${barrierRatings.toLocaleString()} ratings. Reachable with basic marketing.`;
    } else {
      barrierVerdict = "fail";
      barrierDetail = `#10 app has ${barrierRatings.toLocaleString()} ratings. High bar — you'll need significant traction.`;
    }

    // ── Signal 3: Freshness ──
    const freshApps = top25.filter((a) => {
      const age = Date.now() - new Date(a.releaseDate).getTime();
      return age < 2 * 365 * 24 * 60 * 60 * 1000;
    }).length;
    const freshRatio = freshApps / Math.min(top25.length, 1);
    let freshVerdict: string;
    let freshDetail: string;
    if (freshRatio >= 0.3) {
      freshVerdict = "pass";
      freshDetail = `${freshApps}/${top25.length} top apps launched in last 2 years. Market is fluid.`;
    } else if (freshRatio >= 0.15) {
      freshVerdict = "warning";
      freshDetail = `${freshApps}/${top25.length} top apps are recent. Some turnover.`;
    } else {
      freshVerdict = "fail";
      freshDetail = `Only ${freshApps}/${top25.length} top apps are new (last 2 years). Market is stagnant.`;
    }

    // ── Signal 4: Keyword Breadth ──
    const relatedTerms = extractKeywordsFromTexts(
      top25.map((a) => a.trackName),
      q
    );
    const breadthTerms = relatedTerms.filter((t) => t.includes(" ") || t.length > 4);
    let breadthVerdict: string;
    let breadthDetail: string;
    if (breadthTerms.length >= 8) {
      breadthVerdict = "pass";
      breadthDetail = `${breadthTerms.length} related search angles found (e.g., ${breadthTerms.slice(0, 4).join(", ")}).`;
    } else if (breadthTerms.length >= 3) {
      breadthVerdict = "warning";
      breadthDetail = `${breadthTerms.length} related keywords found: ${breadthTerms.join(", ")}.`;
    } else {
      breadthVerdict = "fail";
      breadthDetail = `Only ${breadthTerms.length} related keywords. Narrow search surface.`;
    }

    // ── Signal 5: Competitor Fragmentation ──
    let fragVerdict = "warning";
    let fragDetail = "Could not compute — need competitor data.";
    let fragScore = 50;

    try {
      const topApp = results[0];
      const nameWords = topApp.trackName.split(/\s+/).slice(0, 2).join(" ");
      const compResults = await searchApps(nameWords, country, 10);
      const mainKeywords = findCategoryKeywords(results.slice(0, 25));

      const overlaps: number[] = [];
      for (const comp of compResults) {
        if (comp.trackId === topApp.trackId) continue;
        const compKeywords = findCategoryKeywords([comp]);
        const overlap = computeOverlap(mainKeywords, compKeywords);
        if (overlap.overlapPercentage > 0) {
          overlaps.push(overlap.overlapPercentage);
        }
        if (overlaps.length >= 5) break;
      }

      const avgOverlap = overlaps.length > 0
        ? Math.round(overlaps.reduce((a, b) => a + b, 0) / overlaps.length)
        : 0;

      if (avgOverlap < 20) {
        fragVerdict = "pass";
        fragDetail = `Average keyword overlap is ${avgOverlap}% — competitors don't dominate the same keywords. Room to niche.`;
      } else if (avgOverlap < 50) {
        fragVerdict = "warning";
        fragDetail = `Average overlap ${avgOverlap}% — some keyword turf overlap, but not total.`;
      } else {
        fragVerdict = "fail";
        fragDetail = `Average overlap ${avgOverlap}% — competitors all target the same keywords. Hard to differentiate.`;
      }
      fragScore = Math.max(0, 100 - avgOverlap);
    } catch {
      // fallback
    }

    // ── Signal 6: Review Pain Clusters ──
    let painVerdict = "info";
    let painDetail = "No review data available (need a specific app to analyze).";
    let painScore = 50;

    try {
      const topApp = results[0];
      const reviewData = await getReviews(topApp.trackId, 2);
      const lowStarReviews = reviewData.recentReviews.filter((r) => r.rating <= 2);

      if (lowStarReviews.length >= 3) {
        const painWords = new Map<string, number>();
        for (const r of lowStarReviews) {
          const words = (r.content + " " + r.title)
            .toLowerCase()
            .replace(/[^a-z\s']/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
          for (const w of words) {
            painWords.set(w, (painWords.get(w) || 0) + 1);
          }
        }
        const topPain = [...painWords.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([w]) => w);

        if (topPain.length >= 3) {
          painVerdict = "pass";
          painDetail = `Top complaints in "${topApp.trackName}" reviews: ${topPain.join(", ")}. These are your wedge.`;
        } else {
          painVerdict = "info";
          painDetail = `Few complaints found in top app reviews. Less obvious wedge.`;
        }
      } else {
        painVerdict = "info";
        painDetail = `Few low-star reviews available. Check a more contested category.`;
      }
    } catch {
      // review fetch failed, skip
    }

    // ── Overall Score ──
    const signalScores = [
      titleGapRatio >= 0.7 ? 90 : titleGapRatio >= 0.3 ? 50 : 10,
      barrierRatings < 500 ? 90 : barrierRatings < 10000 ? 50 : 10,
      freshRatio >= 0.3 ? 90 : freshRatio >= 0.15 ? 50 : 10,
      breadthTerms.length >= 8 ? 90 : breadthTerms.length >= 3 ? 50 : 10,
      fragScore,
      painVerdict === "pass" ? 80 : 40,
    ];
    const overallScore = Math.round(
      signalScores.reduce((a, b) => a + b, 0) / signalScores.length
    );

    let overallVerdict: string;
    if (overallScore >= 70) overallVerdict = "strong opportunity";
    else if (overallScore >= 40) overallVerdict = "moderate — needs differentiation";
    else overallVerdict = "hard market — reconsider";

    return NextResponse.json({
      keyword: q,
      totalResults: results.length,
      signals: {
        titleGap: {
          score: Math.round(titleGapRatio * 100),
          verdict: titleGapVerdict,
          detail: titleGapDetail,
          value: `${10 - titleMatchCount}/10 apps don't target this keyword`,
        },
        entryBarrier: {
          score: Math.max(0, Math.min(100, Math.round(100 - Math.log10(barrierRatings + 1) * 14))),
          verdict: barrierVerdict,
          detail: barrierDetail,
          value: `#10 has ${barrierRatings.toLocaleString()} ratings`,
        },
        freshness: {
          score: Math.round(freshRatio * 100),
          verdict: freshVerdict,
          detail: freshDetail,
          value: `${freshApps}/${top25.length} apps launched <2 years ago`,
        },
        keywordBreadth: {
          score: Math.min(100, breadthTerms.length * 12),
          verdict: breadthVerdict,
          detail: breadthDetail,
          value: `${breadthTerms.length} related phrases`,
        },
        competitorFragmentation: {
          score: fragScore,
          verdict: fragVerdict,
          detail: fragDetail,
          value: "",
        },
        reviewPain: {
          score: painVerdict === "pass" ? 80 : painVerdict === "info" ? 50 : 20,
          verdict: painVerdict,
          detail: painDetail,
          value: "",
        },
      },
      overall: {
        score: overallScore,
        verdict: overallVerdict,
      },
    });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 502 });
  }
}
