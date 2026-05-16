import "server-only";
import { chromium } from "playwright";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carouselSlides, carousels } from "@/db/schema";
import { env } from "@/lib/env";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/carousel/styles";
import { issueRenderToken } from "@/carousel/render-token";
import { ensureBucket, uploadCarouselSlide } from "@/clients/storage";

const RENDER_TIMEOUT_MS = 30_000;

export type RenderResult = {
  carouselId: string;
  renderedCount: number;
  errors: { slideNumber: number; error: string }[];
};

/**
 * Render every slide in a carousel to a PNG and upload it to Supabase Storage.
 *
 * The renderer launches a single headless Chromium and walks the slides in
 * order. Each slide is fetched from the internal /_internal/render-slide page
 * with a one-shot HMAC token; the page returns just the slide markup, sized
 * exactly to SLIDE_WIDTH x SLIDE_HEIGHT, so we screenshot the whole viewport.
 *
 * Storage paths land at <bucket>/<carouselId>/slide-<n>.png and the path is
 * persisted to carousel_slides.image_storage_path.
 */
export async function renderCarouselToPng(carouselId: string): Promise<RenderResult> {
  const carousel = (
    await db.select().from(carousels).where(eq(carousels.id, carouselId)).limit(1)
  )[0];
  if (!carousel) throw new Error(`Carousel ${carouselId} not found`);

  const slides = await db
    .select()
    .from(carouselSlides)
    .where(eq(carouselSlides.carouselId, carouselId))
    .orderBy(asc(carouselSlides.slideNumber));
  if (slides.length === 0) {
    return { carouselId, renderedCount: 0, errors: [] };
  }

  await ensureBucket();

  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  await db
    .update(carousels)
    .set({ status: "rendering", updatedAt: new Date() })
    .where(eq(carousels.id, carouselId));

  const browser = await chromium.launch({ headless: true });
  const errors: RenderResult["errors"] = [];
  let renderedCount = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
      deviceScaleFactor: 1,
    });
    for (const slide of slides) {
      const token = issueRenderToken(carouselId, slide.slideNumber);
      const url =
        `${baseUrl}/internal/render-slide` +
        `?carouselId=${encodeURIComponent(carouselId)}` +
        `&n=${slide.slideNumber}` +
        `&token=${encodeURIComponent(token)}`;
      try {
        const page = await context.newPage();
        await page.goto(url, { timeout: RENDER_TIMEOUT_MS, waitUntil: "networkidle" });
        // Screenshot just the slide element so the host page's chrome (root
        // layout body padding, etc) doesn't pollute the PNG.
        const slideEl = page.locator("[data-slide-root] > *").first();
        await slideEl.waitFor({ state: "visible", timeout: RENDER_TIMEOUT_MS });
        const png = await slideEl.screenshot({ type: "png" });
        await page.close();
        const storagePath = await uploadCarouselSlide({
          carouselId,
          slideNumber: slide.slideNumber,
          png: Buffer.from(png),
        });
        await db
          .update(carouselSlides)
          .set({ imageStoragePath: storagePath, updatedAt: new Date() })
          .where(
            and(
              eq(carouselSlides.carouselId, carouselId),
              eq(carouselSlides.slideNumber, slide.slideNumber),
            ),
          );
        renderedCount += 1;
      } catch (err) {
        errors.push({
          slideNumber: slide.slideNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    await context.close();
  } finally {
    await browser.close().catch(() => undefined);
  }

  await db
    .update(carousels)
    .set({
      status: errors.length === 0 ? "rendered" : "partial",
      storageFolder: carouselId,
      updatedAt: new Date(),
    })
    .where(eq(carousels.id, carouselId));

  return { carouselId, renderedCount, errors };
}
