import "server-only";
import { z } from "zod";
import { db } from "@/db/client";
import { researchSources } from "@/db/schema";
import { generateStructured } from "@/clients/llm";
import { search, type SearchResult } from "@/clients/search";
import { runAgentStep, type AgentContext } from "@/agents/context";

export const TrendResearchInputSchema = z.object({
  niche: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  competitors: z.array(z.string()).default([]),
});

export const TrendResearchOutputSchema = z.object({
  themes: z.array(z.string()).max(12),
  hooks: z.array(z.string()).max(12),
  painPoints: z.array(z.string()).max(12),
  angles: z.array(z.string()).max(12),
  sources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().nullable(),
      snippet: z.string().nullable(),
      score: z.number().nullable(),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

export type TrendResearchInput = z.infer<typeof TrendResearchInputSchema>;
export type TrendResearchOutput = z.infer<typeof TrendResearchOutputSchema>;

export async function trendResearchAgent(
  input: TrendResearchInput,
  ctx: AgentContext,
): Promise<TrendResearchOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "trend-research",
    stepName: "research",
    input,
    inputSchema: TrendResearchInputSchema,
    outputSchema: TrendResearchOutputSchema,
    handler: async (i, stepCtx) => {
      const queries = [
        `${i.niche} twitter viral posts`,
        `${i.niche} trending discussion this week`,
        `${i.audience} biggest frustrations ${i.niche}`,
        `${i.niche} ${i.goal} examples`,
        ...i.competitors.slice(0, 2).map((c) => `${c} twitter posts ${i.niche}`),
      ];

      const allResults: SearchResult[] = [];
      for (const q of queries) {
        try {
          const r = await search({
            query: q,
            maxResults: 5,
            ctx: { agentStepId: stepCtx.parentStepId ?? undefined },
          });
          allResults.push(...r);
        } catch (err) {
          await stepCtx.traceClient.warn("search query failed", {
            query: q,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Deduplicate by URL, keep highest score.
      const dedup = new Map<string, SearchResult>();
      for (const r of allResults) {
        const prior = dedup.get(r.url);
        if (!prior || (r.score ?? 0) > (prior.score ?? 0)) dedup.set(r.url, r);
      }
      const sources = Array.from(dedup.values()).slice(0, 20);

      if (sources.length > 0) {
        await db.insert(researchSources).values(
          sources.map((s) => ({
            growthRunId: stepCtx.growthRunId,
            url: s.url,
            title: s.title,
            snippet: s.snippet,
            score: s.score,
          })),
        );
      }

      const summarised = await generateStructured({
        schema: TrendResearchOutputSchema.omit({ sources: true }),
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "trend-research.summarise",
        system:
          "You analyze public engagement patterns and trends. You DO NOT reverse-engineer any platform's algorithm. " +
          "Synthesize themes, hooks, pain points, and angles relevant to the niche, audience, and goal.",
        prompt: [
          `Niche: ${i.niche}`,
          `Audience: ${i.audience}`,
          `Goal: ${i.goal}`,
          `Competitors: ${i.competitors.join(", ") || "(none)"}`,
          "",
          "Use the following research snippets — do not copy verbatim, synthesise.",
          ...sources.map(
            (s, idx) =>
              `[${idx + 1}] ${s.title ?? "(no title)"} — ${s.url}\n${s.snippet ?? ""}`,
          ),
          "",
          "Produce: themes, hooks, painPoints, angles, and a confidence score (0..1).",
        ].join("\n"),
      });

      return { ...summarised, sources };
    },
  });

  return output;
}
