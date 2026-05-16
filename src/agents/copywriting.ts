import "server-only";
import { z } from "zod";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

export const CopyVariantSchema = z.object({
  text: z.string().min(1).max(4000),
  threadJson: z.array(z.string()).optional().nullable(),
  reasoning: z.string(),
});

export const CopywritingInputSchema = z.object({
  brand: z.object({
    niche: z.string(),
    audience: z.string(),
    tone: z.string(),
    sampleStyle: z.string().nullable(),
    bannedWords: z.array(z.string()).default([]),
    ctaPreference: z.string().nullable(),
  }),
  idea: z.object({
    angle: z.string(),
    format: z.enum(["single", "thread", "carousel"]),
    reasoning: z.string(),
  }),
  researchSnippets: z.array(z.string()).max(20).default([]),
  revisionPrompt: z.string().nullable().default(null),
});

export const CopywritingOutputSchema = z.object({
  variants: z.array(CopyVariantSchema).min(1).max(4),
});

export type CopywritingInput = z.infer<typeof CopywritingInputSchema>;
export type CopywritingOutput = z.infer<typeof CopywritingOutputSchema>;

const SYSTEM_PROMPT = `You write original, human-feeling X posts.
Rules:
- DO NOT copy any provided research snippet verbatim. Synthesize, don't paraphrase narrowly.
- Match the brand's tone and audience.
- For "single" format: a single tweet under 280 chars when possible.
- For "thread" format: produce both a leading tweet (text) AND threadJson (the full ordered tweet array including the lead).
- For "carousel" format: produce a CAPTION as text and leave threadJson null.
- Never use banned words. Never make claims you can't support from research.
- Originality guardrail: rewrite, restructure, reframe. No verbatim borrowing.`;

export async function copywritingAgent(
  input: CopywritingInput,
  ctx: AgentContext,
): Promise<CopywritingOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "copywriting",
    stepName: input.revisionPrompt ? "revise" : "draft",
    input,
    inputSchema: CopywritingInputSchema,
    outputSchema: CopywritingOutputSchema,
    handler: async (i, stepCtx) => {
      const result = await generateStructured({
        schema: CopywritingOutputSchema,
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "copywriting.generate",
        system: SYSTEM_PROMPT,
        prompt: JSON.stringify(
          {
            brand: i.brand,
            idea: i.idea,
            researchHints: i.researchSnippets,
            revisionPrompt: i.revisionPrompt,
            output: "2-3 variants, each with text and reasoning",
          },
          null,
          2,
        ),
      });
      return result;
    },
  });

  return output;
}
