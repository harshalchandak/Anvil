import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, carouselSlides, carousels, users } from "@/db/schema";
import { Slide } from "@/carousel/templates/slide";
import type { TemplateName } from "@/carousel/styles";
import { verifyRenderToken } from "@/carousel/render-token";

type Search = Promise<{ carouselId?: string; n?: string; token?: string }>;

/**
 * Internal slide render target. Hit only by the Playwright renderer.
 * Gated by a short-lived HMAC token so it can't be enumerated externally.
 */
export default async function InternalRenderSlide({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { carouselId, n, token } = await searchParams;
  const slideNumber = Number.parseInt(n ?? "", 10);
  if (!carouselId || !token || !Number.isFinite(slideNumber) || slideNumber < 1) {
    notFound();
  }
  if (!verifyRenderToken(token, carouselId, slideNumber)) {
    notFound();
  }

  const row = (
    await db
      .select({
        slide: carouselSlides,
        carousel: carousels,
        user: users,
      })
      .from(carouselSlides)
      .innerJoin(carousels, eq(carousels.id, carouselSlides.carouselId))
      .innerJoin(users, eq(users.id, carousels.userId))
      .where(
        and(
          eq(carouselSlides.carouselId, carouselId),
          eq(carouselSlides.slideNumber, slideNumber),
        ),
      )
      .limit(1)
  )[0];
  if (!row) notFound();

  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, row.carousel.userId))
      .limit(1)
  )[0];

  const totalSlides =
    (
      await db
        .select({ n: carouselSlides.slideNumber })
        .from(carouselSlides)
        .where(eq(carouselSlides.carouselId, carouselId))
    ).length || row.slide.slideNumber;

  return (
    <div data-slide-root style={{ margin: 0, padding: 0 }}>
      <Slide
        template={(row.carousel.template as TemplateName) ?? "minimal-dark"}
        slideNumber={row.slide.slideNumber}
        totalSlides={totalSlides}
        title={row.slide.title}
        body={row.slide.body}
        brand={{
          name: brand?.niche ?? "Netisize",
          handle: row.user.displayName ?? null,
        }}
      />
    </div>
  );
}
