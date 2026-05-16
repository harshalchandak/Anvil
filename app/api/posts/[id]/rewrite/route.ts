import type { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, generatedPosts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { copywritingAgent } from "@/agents/copywriting";
import { brandVoiceAgent } from "@/agents/brand-voice";
import { qualityControlAgent } from "@/agents/quality-control";
import { createTraceClient } from "@/clients/trace";
import type { AgentContext } from "@/agents/context";

const BodySchema = z.object({
  instruction: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const parsed = await parseJson(request, BodySchema);
  if (!parsed.ok) return parsed.response;

  const post = (
    await db
      .select()
      .from(generatedPosts)
      .where(and(eq(generatedPosts.id, id), eq(generatedPosts.userId, appUser.id)))
      .limit(1)
  )[0];
  if (!post) return apiError("Post not found", 404);

  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, appUser.id))
      .limit(1)
  )[0];
  if (!brand) return apiError("No brand profile configured", 412);

  // Re-run copywriting + brand-voice + QC under the post's growth run.
  const ctx: AgentContext = {
    growthRunId: post.growthRunId,
    userId: appUser.id,
    parentStepId: null,
    traceClient: createTraceClient({ growthRunId: post.growthRunId }),
  };

  const copy = await copywritingAgent(
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
        angle: post.reasoning ?? "Rewrite of the previous post.",
        format: post.format,
        reasoning: post.reasoning ?? "User-requested rewrite.",
      },
      researchSnippets: [],
      revisionPrompt: parsed.data.instruction,
    },
    ctx,
  );
  const best = copy.variants[0]!;

  const voiced = await brandVoiceAgent(
    {
      brand: {
        tone: brand.tone,
        sampleStyle: brand.sampleStyle,
        bannedWords: brand.bannedWords ?? [],
        ctaPreference: brand.ctaPreference,
      },
      variant: { text: best.text, threadJson: best.threadJson ?? null },
      format: post.format,
    },
    ctx,
  );

  const qc = await qualityControlAgent(
    {
      brand: { niche: brand.niche, tone: brand.tone, bannedWords: brand.bannedWords ?? [] },
      post: {
        text: voiced.finalText,
        threadJson: voiced.threadJson ?? null,
        format: post.format,
        reasoning: best.reasoning,
      },
      researchSnippets: [],
    },
    ctx,
  );

  await db
    .update(generatedPosts)
    .set({
      text: voiced.finalText,
      threadJson: voiced.threadJson ?? null,
      status: qc.status === "approved" ? "approved" : "needs_revision",
      scoresJson: qc.scores as unknown as Record<string, number>,
      reasoning: best.reasoning,
      riskNotes: qc.riskNotes,
      updatedAt: new Date(),
    })
    .where(eq(generatedPosts.id, id));

  return apiOk({
    post: {
      id,
      text: voiced.finalText,
      status: qc.status === "approved" ? "approved" : "needs_revision",
      scores: qc.scores,
      riskNotes: qc.riskNotes,
    },
  });
}
