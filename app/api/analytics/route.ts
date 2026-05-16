import type { NextRequest } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsSnapshots, generatedPosts, learningInsights } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiOk } from "@/lib/api";

function parseRange(input: string | null): number {
  if (!input) return 7;
  const match = /^(\d+)d$/.exec(input);
  if (!match || !match[1]) return 7;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 90) return 7;
  return n;
}

export async function GET(request: NextRequest) {
  const { appUser } = await requireAppUser();
  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const cutoff = new Date(Date.now() - range * 86400 * 1000);

  // Sum metrics per post within the range. Take the latest snapshot per post.
  const latestPerPost = db
    .select({
      generatedPostId: analyticsSnapshots.generatedPostId,
      maxFetchedAt: sql<Date>`max(${analyticsSnapshots.fetchedAt})`.as(
        "max_fetched_at",
      ),
    })
    .from(analyticsSnapshots)
    .where(
      and(
        eq(analyticsSnapshots.userId, appUser.id),
        gte(analyticsSnapshots.fetchedAt, cutoff),
      ),
    )
    .groupBy(analyticsSnapshots.generatedPostId)
    .as("latest_per_post");

  const rollups = await db
    .select({
      postId: generatedPosts.id,
      text: generatedPosts.text,
      publishedAt: generatedPosts.publishedAt,
      impressions: analyticsSnapshots.impressions,
      likes: analyticsSnapshots.likes,
      replies: analyticsSnapshots.replies,
      reposts: analyticsSnapshots.reposts,
      bookmarks: analyticsSnapshots.bookmarks,
      engagementRate: analyticsSnapshots.engagementRate,
    })
    .from(analyticsSnapshots)
    .innerJoin(
      latestPerPost,
      and(
        eq(latestPerPost.generatedPostId, analyticsSnapshots.generatedPostId),
        eq(latestPerPost.maxFetchedAt, analyticsSnapshots.fetchedAt),
      ),
    )
    .innerJoin(generatedPosts, eq(generatedPosts.id, analyticsSnapshots.generatedPostId))
    .where(eq(analyticsSnapshots.userId, appUser.id));

  if (rollups.length === 0) {
    return apiOk({
      range: `${range}d`,
      totals: { posts: 0, impressions: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0 },
      topPosts: [],
      insights: [],
    });
  }

  const totals = rollups.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      likes: acc.likes + r.likes,
      replies: acc.replies + r.replies,
      reposts: acc.reposts + r.reposts,
      bookmarks: acc.bookmarks + r.bookmarks,
    }),
    { impressions: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0 },
  );

  const topPosts = [...rollups]
    .sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))
    .slice(0, 10);

  const recentInsights = await db
    .select()
    .from(learningInsights)
    .where(
      and(
        eq(learningInsights.userId, appUser.id),
        gte(learningInsights.createdAt, cutoff),
      ),
    )
    .orderBy(desc(learningInsights.createdAt))
    .limit(10);

  return apiOk({
    range: `${range}d`,
    totals: { posts: rollups.length, ...totals },
    topPosts,
    insights: recentInsights,
  });
}
