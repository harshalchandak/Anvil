import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, generatedPosts, growthRuns } from "@/db/schema";
import { createTraceClient } from "@/clients/trace";
import { getMemoryForBrand } from "@/memory/store";
import { trendResearchAgent } from "@/agents/trend-research";
import { viralPatternAnalystAgent } from "@/agents/viral-pattern-analyst";
import {
  buildMemoryDigest,
  contentStrategyAgent,
} from "@/agents/content-strategy";
import { copywritingAgent } from "@/agents/copywriting";
import { brandVoiceAgent } from "@/agents/brand-voice";
import { qualityControlAgent } from "@/agents/quality-control";
import { carouselAgent } from "@/agents/carousel";
import { schedulerPublisherAgent } from "@/agents/scheduler-publisher";
import { renderCarouselToPng } from "@/carousel/renderer";
import type { AgentContext } from "@/agents/context";

const MAX_REVISIONS = 2;

export type GrowthRunSummary = {
  growthRunId: string;
  postsGenerated: number;
  postsApproved: number;
  carouselCreated: boolean;
  scheduledCount: number;
  publishedNow: number;
};

/**
 * Run the full growth pipeline for a single growth_runs row. Designed to be
 * invoked from inside Inngest step.run handlers — each call sets up its own
 * AgentContext and trace client.
 */
export async function runGrowthPipeline(
  growthRunId: string,
): Promise<GrowthRunSummary> {
  const run = (
    await db.select().from(growthRuns).where(eq(growthRuns.id, growthRunId)).limit(1)
  )[0];
  if (!run) throw new Error(`growth_runs ${growthRunId} not found`);

  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, run.brandProfileId))
      .limit(1)
  )[0];
  if (!brand) throw new Error(`brand_profiles ${run.brandProfileId} not found`);

  await db
    .update(growthRuns)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(growthRuns.id, growthRunId));

  const ctx: AgentContext = {
    growthRunId,
    userId: run.userId,
    parentStepId: null,
    traceClient: createTraceClient({ growthRunId }),
  };

  try {
    // 1. Trend research
    const research = await trendResearchAgent(
      {
        niche: brand.niche,
        audience: brand.audience,
        goal: brand.goal,
        competitors: brand.competitors ?? [],
      },
      ctx,
    );

    // 2. Viral patterns
    const patterns = await viralPatternAnalystAgent(
      {
        niche: brand.niche,
        research: {
          themes: research.themes,
          hooks: research.hooks,
          angles: research.angles,
        },
      },
      ctx,
    );

    // 3. Strategy
    const memory = await getMemoryForBrand(brand.id);
    const strategy = await contentStrategyAgent(
      {
        brand: {
          niche: brand.niche,
          audience: brand.audience,
          goal: brand.goal,
          tone: brand.tone,
          frequency: brand.frequency,
          sampleStyle: brand.sampleStyle,
          ctaPreference: brand.ctaPreference,
        },
        research: {
          themes: research.themes,
          hooks: research.hooks,
          painPoints: research.painPoints,
          angles: research.angles,
        },
        patterns: patterns.selectedPatterns.map((p) => ({
          name: p.name,
          whyItApplies: p.whyItApplies,
        })),
        memory: buildMemoryDigest(memory),
        postCount: 5,
        carouselCount: 1,
      },
      ctx,
    );

    // 4. Draft + voice + QC for each non-carousel idea. Revision loop bounded.
    const researchSnippets = research.sources
      .map((s) => `${s.title ?? ""}\n${s.snippet ?? ""}`)
      .filter(Boolean);

    const approvedPostIds: string[] = [];
    let carouselCreated = false;

    for (const idea of strategy.contentPlan) {
      if (idea.format === "carousel") continue;

      let copy = await copywritingAgent(
        {
          brand: {
            niche: brand.niche,
            audience: brand.audience,
            tone: brand.tone,
            sampleStyle: brand.sampleStyle,
            bannedWords: brand.bannedWords ?? [],
            ctaPreference: brand.ctaPreference,
          },
          idea: {
            angle: idea.angle,
            format: idea.format,
            reasoning: idea.reasoning,
          },
          researchSnippets,
          revisionPrompt: null,
        },
        ctx,
      );

      let best = copy.variants[0]!;
      let voiced = await brandVoiceAgent(
        {
          brand: {
            tone: brand.tone,
            sampleStyle: brand.sampleStyle,
            bannedWords: brand.bannedWords ?? [],
            ctaPreference: brand.ctaPreference,
          },
          variant: { text: best.text, threadJson: best.threadJson ?? null },
          format: idea.format,
        },
        ctx,
      );
      let qc = await qualityControlAgent(
        {
          brand: {
            niche: brand.niche,
            tone: brand.tone,
            bannedWords: brand.bannedWords ?? [],
          },
          post: {
            text: voiced.finalText,
            threadJson: voiced.threadJson ?? null,
            format: idea.format,
            reasoning: best.reasoning,
          },
          researchSnippets,
        },
        ctx,
      );

      let revisions = 0;
      while (qc.status === "needs_revision" && revisions < MAX_REVISIONS) {
        revisions += 1;
        copy = await copywritingAgent(
          {
            brand: {
              niche: brand.niche,
              audience: brand.audience,
              tone: brand.tone,
              sampleStyle: brand.sampleStyle,
              bannedWords: brand.bannedWords ?? [],
              ctaPreference: brand.ctaPreference,
            },
            idea: {
              angle: idea.angle,
              format: idea.format,
              reasoning: idea.reasoning,
            },
            researchSnippets,
            revisionPrompt: qc.revisionPrompt ?? "Improve clarity, hook, and originality.",
          },
          ctx,
        );
        best = copy.variants[0]!;
        voiced = await brandVoiceAgent(
          {
            brand: {
              tone: brand.tone,
              sampleStyle: brand.sampleStyle,
              bannedWords: brand.bannedWords ?? [],
              ctaPreference: brand.ctaPreference,
            },
            variant: { text: best.text, threadJson: best.threadJson ?? null },
            format: idea.format,
          },
          ctx,
        );
        qc = await qualityControlAgent(
          {
            brand: {
              niche: brand.niche,
              tone: brand.tone,
              bannedWords: brand.bannedWords ?? [],
            },
            post: {
              text: voiced.finalText,
              threadJson: voiced.threadJson ?? null,
              format: idea.format,
              reasoning: best.reasoning,
            },
            researchSnippets,
          },
          ctx,
        );
      }

      const inserted = await db
        .insert(generatedPosts)
        .values({
          growthRunId,
          userId: run.userId,
          format: idea.format,
          text: voiced.finalText,
          threadJson: voiced.threadJson ?? null,
          status: qc.status === "approved" ? "approved" : "needs_revision",
          scheduledFor: new Date(idea.scheduledFor),
          scoresJson: qc.scores as unknown as Record<string, number>,
          reasoning: best.reasoning,
          riskNotes: qc.riskNotes,
        })
        .returning({ id: generatedPosts.id });
      const postId = inserted[0]?.id;
      if (postId && qc.status === "approved") approvedPostIds.push(postId);
    }

    // 5. Carousel — pick the first carousel-format idea, build outline + slides.
    const carouselIdea = strategy.contentPlan.find((idea) => idea.format === "carousel");
    if (carouselIdea) {
      const carouselOut = await carouselAgent(
        {
          brand: {
            niche: brand.niche,
            tone: brand.tone,
            ctaPreference: brand.ctaPreference,
          },
          idea: { angle: carouselIdea.angle, reasoning: carouselIdea.reasoning },
          generatedPostId: null,
          template: "minimal-dark",
        },
        ctx,
      );
      carouselCreated = true;

      // Render slides to PNGs and upload to storage. Failures don't fail the run.
      try {
        const render = await renderCarouselToPng(carouselOut.carouselId);
        await ctx.traceClient.info("carousel render complete", {
          carouselId: render.carouselId,
          renderedCount: render.renderedCount,
          errorCount: render.errors.length,
        });
      } catch (err) {
        await ctx.traceClient.error("carousel render failed", {
          carouselId: carouselOut.carouselId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 6. Schedule / publish
    let scheduledCount = 0;
    let publishedNow = 0;
    if (approvedPostIds.length > 0) {
      const sched = await schedulerPublisherAgent(
        {
          brandProfileId: brand.id,
          generatedPostIds: approvedPostIds,
        },
        ctx,
      );
      scheduledCount = sched.scheduledCount;
      publishedNow = sched.publishedNow.length;
    }

    const totalPosts = strategy.contentPlan.filter(
      (i) => i.format !== "carousel",
    ).length;

    const summary: GrowthRunSummary = {
      growthRunId,
      postsGenerated: totalPosts,
      postsApproved: approvedPostIds.length,
      carouselCreated,
      scheduledCount,
      publishedNow,
    };

    await db
      .update(growthRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        summary: summary as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(growthRuns.id, growthRunId));

    return summary;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(growthRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        error: message,
        updatedAt: new Date(),
      })
      .where(eq(growthRuns.id, growthRunId));
    await ctx.traceClient.error("growth run failed", { error: message });
    throw err;
  }
}
