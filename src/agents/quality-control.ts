import "server-only";
import { z } from "zod";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

const ScoreInt = z.number().int().min(1).max(10);

export const QualityControlInputSchema = z.object({
  brand: z.object({
    niche: z.string(),
    tone: z.string(),
    bannedWords: z.array(z.string()).default([]),
  }),
  post: z.object({
    text: z.string().min(1),
    threadJson: z.array(z.string()).optional().nullable(),
    format: z.enum(["single", "thread", "carousel"]),
    reasoning: z.string().optional(),
  }),
  researchSnippets: z.array(z.string()).max(20).default([]),
});

export const QualityControlOutputSchema = z.object({
  scores: z.object({
    hookStrength: ScoreInt,
    clarity: ScoreInt,
    originality: ScoreInt,
    brandFit: ScoreInt,
    humanLikeness: ScoreInt,
  }),
  riskNotes: z.string().nullable(),
  status: z.enum(["approved", "needs_revision"]),
  revisionPrompt: z.string().nullable(),
  ngramOverlapRatio: z.number().min(0).max(1),
});

export type QualityControlInput = z.infer<typeof QualityControlInputSchema>;
export type QualityControlOutput = z.infer<typeof QualityControlOutputSchema>;

function ngrams(text: string, n: number): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const out = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    out.add(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

function ngramOverlap(postText: string, sources: string[]): number {
  const N = 5;
  const postGrams = ngrams(postText, N);
  if (postGrams.size === 0) return 0;
  let overlap = 0;
  for (const src of sources) {
    const srcGrams = ngrams(src, N);
    for (const g of postGrams) {
      if (srcGrams.has(g)) overlap += 1;
    }
  }
  return Math.min(overlap / postGrams.size, 1);
}

export async function qualityControlAgent(
  input: QualityControlInput,
  ctx: AgentContext,
): Promise<QualityControlOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "quality-control",
    stepName: "score",
    input,
    inputSchema: QualityControlInputSchema,
    outputSchema: QualityControlOutputSchema,
    handler: async (i, stepCtx) => {
      const overlap = ngramOverlap(i.post.text, i.researchSnippets);

      const llm = await generateStructured({
        schema: QualityControlOutputSchema.omit({ ngramOverlapRatio: true }),
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "quality-control.score",
        system:
          "You're a strict QA reviewer. Score 1-10 (10 = excellent) on hookStrength, " +
          "clarity, originality, brandFit, humanLikeness. If any score < 6 OR if the post " +
          "contains a banned word, set status to 'needs_revision' and write a precise " +
          "one-paragraph revisionPrompt the copywriter can act on. Otherwise 'approved'.",
        prompt: JSON.stringify(
          {
            brand: i.brand,
            post: i.post,
            researchSnippetsForOriginalityCheck: i.researchSnippets,
            measuredNgramOverlapRatio: overlap,
            note:
              "If measuredNgramOverlapRatio > 0.4, force status='needs_revision' with a revisionPrompt that explicitly asks for original phrasing.",
          },
          null,
          2,
        ),
      });

      const status: "approved" | "needs_revision" =
        overlap > 0.4 ? "needs_revision" : llm.status;
      const revisionPrompt =
        overlap > 0.4
          ? `Post borrows too much from research (n-gram overlap ${(overlap * 100).toFixed(0)}%). Rewrite in your own voice — no near-verbatim phrases.`
          : llm.revisionPrompt;

      return { ...llm, status, revisionPrompt, ngramOverlapRatio: overlap };
    },
  });

  return output;
}
