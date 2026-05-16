import "server-only";
import { z } from "zod";
import { db } from "@/db/client";
import { carousels, carouselSlides } from "@/db/schema";
import { generateStructured } from "@/clients/llm";
import { runAgentStep, type AgentContext } from "@/agents/context";

const SlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(8),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(280),
  visualPrompt: z.string().nullable(),
});

export const CarouselInputSchema = z.object({
  brand: z.object({
    niche: z.string(),
    tone: z.string(),
    ctaPreference: z.string().nullable(),
  }),
  idea: z.object({ angle: z.string(), reasoning: z.string() }),
  generatedPostId: z.string().uuid().nullable(),
  template: z
    .enum(["minimal-dark", "premium-light", "founder-notes", "neon-tech", "soft-pastel"])
    .default("minimal-dark"),
});

export const CarouselOutputSchema = z.object({
  carouselId: z.string().uuid(),
  template: z.string(),
  caption: z.string(),
  slides: z.array(SlideSchema).min(6).max(8),
});

export type CarouselInput = z.infer<typeof CarouselInputSchema>;
export type CarouselOutput = z.infer<typeof CarouselOutputSchema>;

export async function carouselAgent(
  input: CarouselInput,
  ctx: AgentContext,
): Promise<CarouselOutput> {
  const { output } = await runAgentStep({
    ctx,
    agentName: "carousel",
    stepName: "outline",
    input,
    inputSchema: CarouselInputSchema,
    outputSchema: CarouselOutputSchema,
    handler: async (i, stepCtx) => {
      const llm = await generateStructured({
        schema: z.object({
          caption: z.string().min(1).max(2000),
          slides: z.array(SlideSchema).length(8),
        }),
        ctx: { agentStepId: stepCtx.parentStepId ?? null },
        toolName: "carousel.outline",
        system:
          "Design an 8-slide X carousel. Slide roles: 1=hook, 2=context, 3=insight, " +
          "4=framework, 5=example, 6=takeaway, 7=CTA, 8=signature. Each body <= 280 chars. " +
          "visualPrompt may describe imagery for the slide.",
        prompt: JSON.stringify({ brand: i.brand, idea: i.idea }, null, 2),
      });

      const inserted = await db
        .insert(carousels)
        .values({
          growthRunId: stepCtx.growthRunId,
          generatedPostId: i.generatedPostId,
          userId: ctx.userId,
          template: i.template,
          status: "outlined",
          caption: llm.caption,
        })
        .returning({ id: carousels.id });
      const carouselRow = inserted[0];
      if (!carouselRow) throw new Error("Failed to persist carousel row");

      await db.insert(carouselSlides).values(
        llm.slides.map((s) => ({
          carouselId: carouselRow.id,
          slideNumber: s.slideNumber,
          title: s.title,
          body: s.body,
          visualPrompt: s.visualPrompt ?? null,
        })),
      );

      return {
        carouselId: carouselRow.id,
        template: i.template,
        caption: llm.caption,
        slides: llm.slides,
      };
    },
  });

  return output;
}
