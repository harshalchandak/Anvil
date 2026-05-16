import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsSnapshots,
  brandProfiles,
  generatedPosts,
  learningInsights,
} from "@/db/schema";

export type BrandMemory = {
  approvedPosts: { id: string; text: string; createdAt: Date }[];
  rejectedPosts: { id: string; text: string; reasoning: string | null }[];
  topPerformingHooks: { id: string; text: string; engagementRate: number | null }[];
  weakPatterns: { insight: Record<string, unknown>; confidence: number | null }[];
  userEdits: { id: string; text: string }[];
  themes: string[];
};

const ENGAGEMENT_TOP_N = 5;
const RECENT_INSIGHT_DAYS = 30;

export async function getMemoryForBrand(
  brandProfileId: string,
): Promise<BrandMemory> {
  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, brandProfileId))
      .limit(1)
  )[0];
  if (!brand) {
    throw new Error(`Brand profile ${brandProfileId} not found`);
  }

  const userId = brand.userId;

  const [approved, rejected, topRows, insights] = await Promise.all([
    db
      .select({
        id: generatedPosts.id,
        text: generatedPosts.text,
        createdAt: generatedPosts.createdAt,
      })
      .from(generatedPosts)
      .where(
        and(eq(generatedPosts.userId, userId), eq(generatedPosts.status, "approved")),
      )
      .orderBy(desc(generatedPosts.createdAt))
      .limit(20),
    db
      .select({
        id: generatedPosts.id,
        text: generatedPosts.text,
        reasoning: generatedPosts.reasoning,
      })
      .from(generatedPosts)
      .where(
        and(
          eq(generatedPosts.userId, userId),
          eq(generatedPosts.status, "needs_revision"),
        ),
      )
      .orderBy(desc(generatedPosts.createdAt))
      .limit(20),
    db
      .select({
        id: generatedPosts.id,
        text: generatedPosts.text,
        engagementRate: sql<number | null>`max(${analyticsSnapshots.engagementRate})`.as(
          "engagement_rate",
        ),
      })
      .from(generatedPosts)
      .innerJoin(
        analyticsSnapshots,
        eq(analyticsSnapshots.generatedPostId, generatedPosts.id),
      )
      .where(eq(generatedPosts.userId, userId))
      .groupBy(generatedPosts.id, generatedPosts.text)
      .orderBy(desc(sql`max(${analyticsSnapshots.engagementRate})`))
      .limit(ENGAGEMENT_TOP_N),
    db
      .select({
        insightType: learningInsights.insightType,
        content: learningInsights.content,
        confidence: learningInsights.confidence,
      })
      .from(learningInsights)
      .where(
        and(
          eq(learningInsights.userId, userId),
          gte(
            learningInsights.createdAt,
            new Date(Date.now() - RECENT_INSIGHT_DAYS * 86400 * 1000),
          ),
        ),
      )
      .orderBy(desc(learningInsights.createdAt))
      .limit(50),
  ]);

  const topPerformingHooks = topRows.map((r) => ({
    id: r.id,
    text: r.text,
    engagementRate: r.engagementRate,
  }));

  const weakPatterns = insights
    .filter((i) => i.insightType === "weak_pattern")
    .map((i) => ({
      insight: (i.content ?? {}) as Record<string, unknown>,
      confidence: i.confidence,
    }));

  const themes = uniq(
    insights
      .filter((i) => i.insightType === "theme")
      .map((i) => (i.content as Record<string, unknown>)["name"])
      .filter((v): v is string => typeof v === "string"),
  );

  return {
    approvedPosts: approved,
    rejectedPosts: rejected.map((r) => ({
      id: r.id,
      text: r.text,
      reasoning: r.reasoning,
    })),
    topPerformingHooks,
    weakPatterns,
    userEdits: [],
    themes,
  };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
