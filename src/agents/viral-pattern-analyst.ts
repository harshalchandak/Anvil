import "server-only";
import { z } from "zod";
import { db } from "@/db/client";
import { viralPatterns } from "@/db/schema";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

const PatternRefSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string(),
  whyItApplies: z.string(),
});

const NewPatternSchema = z.object({
  name: z.string(),
  description: z.string(),
  whyItWorks: z.string(),
  exampleStructure: z.string().nullable(),
  whenToUse: z.string().nullable(),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
  ctaSuggestion: z.string().nullable(),
});

export const ViralPatternInputSchema = z.object({
  research: z.object({
    themes: z.array(z.string()),
    hooks: z.array(z.string()),
    angles: z.array(z.string()),
  }),
  niche: z.string(),
});

export const ViralPatternOutputSchema = z.object({
  selectedPatterns: z.array(PatternRefSchema),
  newPatterns: z.array(NewPatternSchema),
});

export type ViralPatternInput = z.infer<typeof ViralPatternInputSchema>;
export type ViralPatternOutput = z.infer<typeof ViralPatternOutputSchema>;

export async function viralPatternAnalystAgent(
  input: ViralPatternInput,
  ctx: AgentContext,
): Promise<ViralPatternOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "viral-pattern-analyst",
    stepName: "pattern-extraction",
    input,
    inputSchema: ViralPatternInputSchema,
    outputSchema: ViralPatternOutputSchema,
    handler: async (i, stepCtx) => {
      const existing = await db.select().from(viralPatterns);
      const knownList = existing.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      }));

      const llm = await generateStructured({
        schema: ViralPatternOutputSchema,
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "viral-pattern.extract",
        system:
          "You analyze public engagement patterns. Identify which KNOWN patterns apply " +
          "to this research and propose NEW patterns observed. Never recommend deceptive tactics.",
        prompt: JSON.stringify(
          {
            niche: i.niche,
            research: i.research,
            knownPatterns: knownList,
            instructions:
              "Return up to 5 selectedPatterns referencing knownPatterns by id+name " +
              "with a one-line whyItApplies. Return up to 3 newPatterns (genuinely new — " +
              "do NOT duplicate knownPatterns).",
          },
          null,
          2,
        ),
      });

      // Persist new patterns globally so other runs benefit.
      for (const np of llm.newPatterns) {
        await db
          .insert(viralPatterns)
          .values({
            name: np.name,
            description: np.description,
            whyItWorks: np.whyItWorks,
            exampleStructure: np.exampleStructure ?? null,
            whenToUse: np.whenToUse ?? null,
            riskLevel: np.riskLevel,
            ctaSuggestion: np.ctaSuggestion ?? null,
          })
          .onConflictDoNothing({ target: viralPatterns.name });
      }

      return llm;
    },
  });

  return output;
}
