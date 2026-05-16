import "server-only";
import { z } from "zod";
import { db } from "@/db/client";
import { contentIdeas } from "@/db/schema";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";
import type { BrandMemory } from "@/memory/store";

const FrequencyToDays: Record<string, number> = {
  daily: 1,
  "every-2-days": 2,
  weekly: 7,
  "3x-per-week": 2,
};

export const ContentIdeaSchema = z.object({
  angle: z.string().min(1),
  format: z.enum(["single", "thread", "carousel"]),
  targetGoal: z.string().nullable(),
  reasoning: z.string(),
});

export const ContentStrategyInputSchema = z.object({
  brand: z.object({
    niche: z.string(),
    audience: z.string(),
    goal: z.string(),
    tone: z.string(),
    frequency: z.string(),
    sampleStyle: z.string().nullable(),
    ctaPreference: z.string().nullable(),
  }),
  research: z.object({
    themes: z.array(z.string()),
    hooks: z.array(z.string()),
    painPoints: z.array(z.string()),
    angles: z.array(z.string()),
  }),
  patterns: z.array(z.object({ name: z.string(), whyItApplies: z.string() })),
  memory: z.object({
    approvedSamples: z.array(z.string()).max(20),
    rejectedSamples: z.array(z.string()).max(20),
    topHooks: z.array(z.string()).max(10),
    themes: z.array(z.string()).max(10),
  }),
  postCount: z.number().int().min(1).max(10).default(5),
  carouselCount: z.number().int().min(0).max(3).default(1),
});

export const ContentStrategyOutputSchema = z.object({
  contentPlan: z
    .array(
      ContentIdeaSchema.extend({
        scheduledFor: z.string().datetime(),
      }),
    )
    .min(1),
});

export type ContentStrategyInput = z.infer<typeof ContentStrategyInputSchema>;
export type ContentStrategyOutput = z.infer<typeof ContentStrategyOutputSchema>;

export function buildMemoryDigest(memory: BrandMemory) {
  return {
    approvedSamples: memory.approvedPosts.slice(0, 10).map((p) => p.text),
    rejectedSamples: memory.rejectedPosts.slice(0, 10).map((p) => p.text),
    topHooks: memory.topPerformingHooks.slice(0, 10).map((p) => p.text),
    themes: memory.themes.slice(0, 10),
  };
}

function nextSlots(frequency: string, count: number, startFromIso: string): string[] {
  const step = FrequencyToDays[frequency] ?? 1;
  const out: string[] = [];
  const cursor = new Date(startFromIso);
  for (let i = 0; i < count; i++) {
    cursor.setUTCDate(cursor.getUTCDate() + (i === 0 ? 1 : step));
    cursor.setUTCHours(15, 0, 0, 0); // 3pm UTC default
    out.push(new Date(cursor).toISOString());
  }
  return out;
}

export async function contentStrategyAgent(
  input: ContentStrategyInput,
  ctx: AgentContext,
): Promise<ContentStrategyOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "content-strategy",
    stepName: "plan",
    input,
    inputSchema: ContentStrategyInputSchema,
    outputSchema: ContentStrategyOutputSchema,
    handler: async (i, stepCtx) => {
      const totalCount = i.postCount + i.carouselCount;
      const slots = nextSlots(
        i.brand.frequency,
        totalCount,
        new Date().toISOString(),
      );

      const planLlm = await generateStructured({
        schema: z.object({
          contentPlan: z.array(ContentIdeaSchema).length(totalCount),
        }),
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "content-strategy.plan",
        system:
          "You build a coherent X content plan. Mix formats (single posts, threads, carousels). " +
          "Each idea must serve the brand goal. Reuse what has worked, avoid what has been rejected.",
        prompt: JSON.stringify(
          {
            brand: i.brand,
            research: i.research,
            patterns: i.patterns,
            memory: i.memory,
            requirements: {
              singleOrThreadPosts: i.postCount,
              carousels: i.carouselCount,
            },
          },
          null,
          2,
        ),
      });

      // Ensure at least the requested number of carousels.
      const ideas = planLlm.contentPlan;
      const withSlots = ideas.map((idea, idx) => ({
        ...idea,
        scheduledFor: slots[idx]!,
      }));

      await db.insert(contentIdeas).values(
        withSlots.map((idea) => ({
          growthRunId: stepCtx.growthRunId,
          angle: idea.angle,
          format: idea.format,
          targetGoal: idea.targetGoal,
          reasoning: idea.reasoning,
          scheduledFor: new Date(idea.scheduledFor),
        })),
      );

      return { contentPlan: withSlots };
    },
  });

  return output;
}
