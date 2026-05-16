import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, carousels, carouselSlides } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";
import { carouselAgent } from "@/agents/carousel";
import { createTraceClient } from "@/clients/trace";
import type { AgentContext } from "@/agents/context";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const carousel = (
    await db
      .select()
      .from(carousels)
      .where(and(eq(carousels.id, id), eq(carousels.userId, appUser.id)))
      .limit(1)
  )[0];
  if (!carousel) return apiError("Carousel not found", 404);

  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, appUser.id))
      .limit(1)
  )[0];
  if (!brand) return apiError("No brand profile configured", 412);

  // Drop existing slides; the agent will write a fresh set.
  await db.delete(carouselSlides).where(eq(carouselSlides.carouselId, id));

  const ctx: AgentContext = {
    growthRunId: carousel.growthRunId,
    userId: appUser.id,
    parentStepId: null,
    traceClient: createTraceClient({ growthRunId: carousel.growthRunId }),
  };

  const result = await carouselAgent(
    {
      brand: {
        niche: brand.niche,
        tone: brand.tone,
        ctaPreference: brand.ctaPreference,
      },
      idea: { angle: "Regenerate carousel", reasoning: "User-requested regeneration" },
      generatedPostId: carousel.generatedPostId,
      template: (carousel.template as
        | "minimal-dark"
        | "premium-light"
        | "founder-notes"
        | "neon-tech"
        | "soft-pastel") ?? "minimal-dark",
    },
    ctx,
  );

  return apiOk({ carouselId: result.carouselId, slideCount: result.slides.length });
}
