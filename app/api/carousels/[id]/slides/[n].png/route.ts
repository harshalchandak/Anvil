import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carouselSlides, carousels } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { downloadCarouselSlide } from "@/clients/storage";

/**
 * Proxy a rendered carousel slide PNG from Supabase Storage.
 * Auth is required; RLS prevents access to other users' slides via the
 * storage client (we additionally enforce userId here for defense in depth).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id, n } = await params;
  const slideNumber = Number.parseInt(n, 10);
  if (!Number.isFinite(slideNumber) || slideNumber < 1) {
    return apiError("Invalid slide number", 400);
  }

  const slide = (
    await db
      .select({ path: carouselSlides.imageStoragePath })
      .from(carouselSlides)
      .innerJoin(carousels, eq(carousels.id, carouselSlides.carouselId))
      .where(
        and(
          eq(carouselSlides.carouselId, id),
          eq(carouselSlides.slideNumber, slideNumber),
          eq(carousels.userId, appUser.id),
        ),
      )
      .limit(1)
  )[0];
  if (!slide) return apiError("Slide not found", 404);
  if (!slide.path) {
    return apiError("Slide PNG not rendered yet — try regenerating", 409);
  }

  try {
    const png = await downloadCarouselSlide(slide.path);
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    return apiError(
      `Failed to load slide PNG: ${err instanceof Error ? err.message : String(err)}`,
      502,
    );
  }
}
