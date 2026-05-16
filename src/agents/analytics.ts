import "server-only";
import { z } from "zod";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsSnapshots, generatedPosts, learningInsights } from "@/db/schema";
import { getXClientForUser } from "@/clients/x";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

const InsightContentSchema = z.object({
  bestHookStyle: z.string().nullable(),
  bestTimeOfDay: z.string().nullable(),
  topicsToRepeat: z.array(z.string()).default([]),
  topicsToAvoid: z.array(z.string()).default([]),
  notes: z.string().nullable(),
});

export const AnalyticsInputSchema = z.object({
  daysBack: z.number().int().min(1).max(30).default(7),
});

export const AnalyticsOutputSchema = z.object({
  snapshotCount: z.number().int().min(0),
  insightsWritten: z.number().int().min(0),
});

export type AnalyticsInput = z.infer<typeof AnalyticsInputSchema>;
export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;

/**
 * Pull metrics from X for a user's recently-published posts and (optionally)
 * generate a rolling learning insight. Pure function — no growth_run / step
 * lifecycle. Used by both the in-run agent wrapper below and the Inngest cron.
 */
export async function refreshAnalyticsForUser(args: {
  userId: string;
  daysBack?: number;
  agentStepId?: string | null;
}): Promise<AnalyticsOutput> {
  const daysBack = args.daysBack ?? 7;
  const cutoff = new Date(Date.now() - daysBack * 86400 * 1000);

  const published = await db
    .select()
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.userId, args.userId),
        eq(generatedPosts.status, "published"),
        isNotNull(generatedPosts.xPostId),
        gte(generatedPosts.publishedAt, cutoff),
      ),
    );
  if (published.length === 0) return { snapshotCount: 0, insightsWritten: 0 };

  let xClient;
  try {
    xClient = await getXClientForUser(args.userId);
  } catch {
    return { snapshotCount: 0, insightsWritten: 0 };
  }

  let snapshotCount = 0;
  const rolling: {
    text: string;
    publishedAt: Date | null;
    impressions: number;
    likes: number;
    engagementRate: number;
  }[] = [];

  for (const post of published) {
    if (!post.xPostId) continue;
    try {
      const m = await xClient.getTweetMetrics(post.xPostId, {
        ...(args.agentStepId ? { agentStepId: args.agentStepId } : {}),
      });
      const engagementRate =
        m.impressions > 0
          ? (m.likes + m.replies + m.reposts + m.bookmarks) / m.impressions
          : 0;
      await db.insert(analyticsSnapshots).values({
        generatedPostId: post.id,
        userId: args.userId,
        impressions: m.impressions,
        likes: m.likes,
        replies: m.replies,
        reposts: m.reposts,
        bookmarks: m.bookmarks,
        engagementRate,
      });
      snapshotCount += 1;
      rolling.push({
        text: post.text,
        publishedAt: post.publishedAt,
        impressions: m.impressions,
        likes: m.likes,
        engagementRate,
      });
    } catch {
      // Individual post failures don't kill the batch.
    }
  }

  if (rolling.length === 0) return { snapshotCount, insightsWritten: 0 };

  try {
    const insight = await generateStructured({
      schema: InsightContentSchema,
      ctx: args.agentStepId ? { agentStepId: args.agentStepId } : undefined,
      toolName: "analytics.summarise",
      system:
        "Given a set of (post, metrics), find the best hook style, best time of day, " +
        "topics to repeat, topics to avoid. Be concrete and short.",
      prompt: JSON.stringify(rolling, null, 2),
    });

    await db.insert(learningInsights).values({
      userId: args.userId,
      insightType: "rolling_summary",
      content: insight as unknown as Record<string, unknown>,
      confidence: Math.min(1, rolling.length / 10),
    });
    return { snapshotCount, insightsWritten: 1 };
  } catch {
    return { snapshotCount, insightsWritten: 0 };
  }
}

export async function analyticsAgent(
  input: AnalyticsInput,
  ctx: AgentContext,
): Promise<AnalyticsOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "analytics",
    stepName: "fetch-and-learn",
    input,
    inputSchema: AnalyticsInputSchema,
    outputSchema: AnalyticsOutputSchema,
    handler: (i, stepCtx) =>
      refreshAnalyticsForUser({
        userId: ctx.userId,
        daysBack: i.daysBack,
        agentStepId: stepCtx.parentStepId,
      }),
  });
  return output;
}
