import "server-only";
import { z } from "zod";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

export const BrandVoiceInputSchema = z.object({
  brand: z.object({
    tone: z.string(),
    sampleStyle: z.string().nullable(),
    bannedWords: z.array(z.string()).default([]),
    ctaPreference: z.string().nullable(),
  }),
  variant: z.object({
    text: z.string(),
    threadJson: z.array(z.string()).optional().nullable(),
  }),
  format: z.enum(["single", "thread", "carousel"]),
});

export const BrandVoiceOutputSchema = z.object({
  finalText: z.string().min(1),
  threadJson: z.array(z.string()).optional().nullable(),
  humanLikenessScore: z.number().int().min(1).max(10),
  changesApplied: z.array(z.string()),
});

export type BrandVoiceInput = z.infer<typeof BrandVoiceInputSchema>;
export type BrandVoiceOutput = z.infer<typeof BrandVoiceOutputSchema>;

export async function brandVoiceAgent(
  input: BrandVoiceInput,
  ctx: AgentContext,
): Promise<BrandVoiceOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "brand-voice",
    stepName: "rewrite",
    input,
    inputSchema: BrandVoiceInputSchema,
    outputSchema: BrandVoiceOutputSchema,
    handler: async (i, stepCtx) => {
      const llm = await generateStructured({
        schema: BrandVoiceOutputSchema,
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "brand-voice.rewrite",
        system:
          "Rewrite the variant to match the brand voice exactly. Remove banned words. " +
          "Preserve the core message. Score human-likeness 1-10 (10 = indistinguishable from a thoughtful human). " +
          "List the concrete changes you applied.",
        prompt: JSON.stringify(
          {
            brand: i.brand,
            currentVariant: i.variant,
            format: i.format,
          },
          null,
          2,
        ),
      });

      // Hard-strip any banned words that survived (defensive).
      let finalText = llm.finalText;
      for (const w of i.brand.bannedWords) {
        if (!w) continue;
        const safe = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        finalText = finalText.replace(new RegExp(`\\b${safe}\\b`, "gi"), "[…]");
      }

      return { ...llm, finalText };
    },
  });

  return output;
}
