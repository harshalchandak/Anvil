import "server-only";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db/client";
import { generatedPosts } from "@/db/schema";
import { refreshAnalyticsForUser } from "@/agents/analytics";

/**
 * Every 6 hours: enumerate users who have a published post in the last 7 days
 * and refresh their metrics. Fan-out happens within a single function — each
 * user becomes its own durable step.run so a failure on one user doesn't
 * tank the whole batch.
 */
export const analyticsRefreshCron = inngest.createFunction(
  {
    id: "analytics-refresh-cron",
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }) => {
    const userIds = await step.run("collect-recent-users", async () => {
      const cutoff = new Date(Date.now() - 7 * 86400 * 1000);
      const rows = await db
        .selectDistinct({ userId: generatedPosts.userId })
        .from(generatedPosts)
        .where(
          and(
            eq(generatedPosts.status, "published"),
            isNotNull(generatedPosts.publishedAt),
            gte(generatedPosts.publishedAt, cutoff),
          ),
        );
      return rows.map((r) => r.userId);
    });

    let totalSnapshots = 0;
    let totalInsights = 0;
    for (const userId of userIds) {
      const result = await step.run(`refresh-${userId}`, () =>
        refreshAnalyticsForUser({ userId, daysBack: 7 }),
      );
      totalSnapshots += result.snapshotCount;
      totalInsights += result.insightsWritten;
    }
    return {
      processedUsers: userIds.length,
      snapshots: totalSnapshots,
      insights: totalInsights,
    };
  },
);

/**
 * Event-triggered on-demand refresh for a single user.
 */
export const analyticsOnDemandFn = inngest.createFunction(
  {
    id: "analytics-refresh-user",
    triggers: [{ event: "analytics/refresh" }],
  },
  async ({ event, step }) => {
    const data = event.data as { userId: string; daysBack?: number };
    return step.run("refresh", () =>
      refreshAnalyticsForUser({
        userId: data.userId,
        daysBack: data.daysBack ?? 7,
      }),
    );
  },
);
