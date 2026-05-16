import "server-only";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, generatedPosts } from "@/db/schema";
import { env } from "@/lib/env";
import { getXClientForUser } from "@/clients/x";
import { runAgentStep, type AgentContext } from "@/agents/context";

export const SchedulerPublisherInputSchema = z.object({
  brandProfileId: z.string().uuid(),
  generatedPostIds: z.array(z.string().uuid()).min(1),
});

export const SchedulerPublisherOutputSchema = z.object({
  scheduledCount: z.number().int().min(0),
  publishedNow: z.array(
    z.object({ generatedPostId: z.string().uuid(), xPostId: z.string() }),
  ),
  failed: z.array(
    z.object({ generatedPostId: z.string().uuid(), error: z.string() }),
  ),
});

export type SchedulerPublisherInput = z.infer<typeof SchedulerPublisherInputSchema>;
export type SchedulerPublisherOutput = z.infer<typeof SchedulerPublisherOutputSchema>;

export async function schedulerPublisherAgent(
  input: SchedulerPublisherInput,
  ctx: AgentContext,
): Promise<SchedulerPublisherOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "scheduler-publisher",
    stepName: "schedule-or-publish",
    input,
    inputSchema: SchedulerPublisherInputSchema,
    outputSchema: SchedulerPublisherOutputSchema,
    handler: async (i, stepCtx) => {
      const brand = (
        await db
          .select()
          .from(brandProfiles)
          .where(eq(brandProfiles.id, i.brandProfileId))
          .limit(1)
      )[0];
      if (!brand) throw new Error(`Brand profile ${i.brandProfileId} not found`);

      const posts = await db
        .select()
        .from(generatedPosts)
        .where(
          and(
            inArray(generatedPosts.id, i.generatedPostIds),
            eq(generatedPosts.userId, ctx.userId),
          ),
        );

      const publishedNow: SchedulerPublisherOutput["publishedNow"] = [];
      const failed: SchedulerPublisherOutput["failed"] = [];
      let scheduledCount = 0;
      const autopilotOn =
        brand.approvalMode === "autopilot" && env.ENABLE_REAL_PUBLISHING;

      for (const post of posts) {
        const due =
          post.scheduledFor !== null && post.scheduledFor.getTime() <= Date.now();
        if (!autopilotOn || !due) {
          await db
            .update(generatedPosts)
            .set({ status: "scheduled", updatedAt: new Date() })
            .where(eq(generatedPosts.id, post.id));
          scheduledCount += 1;
          continue;
        }
        try {
          const xClient = await getXClientForUser(ctx.userId);
          const res = await xClient.tweet(
            { text: post.text },
            { agentStepId: stepCtx.parentStepId ?? undefined },
          );
          await db
            .update(generatedPosts)
            .set({
              status: "published",
              publishedAt: new Date(),
              xPostId: res.id,
              updatedAt: new Date(),
            })
            .where(eq(generatedPosts.id, post.id));
          publishedNow.push({ generatedPostId: post.id, xPostId: res.id });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await db
            .update(generatedPosts)
            .set({ status: "failed", riskNotes: message, updatedAt: new Date() })
            .where(eq(generatedPosts.id, post.id));
          failed.push({ generatedPostId: post.id, error: message });
          await stepCtx.traceClient.error("publish failed", {
            generatedPostId: post.id,
            error: message,
          });
        }
      }

      return { scheduledCount, publishedNow, failed };
    },
  });

  return output;
}
