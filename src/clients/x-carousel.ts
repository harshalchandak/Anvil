import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carouselSlides, carousels } from "@/db/schema";
import { getXClientForUser } from "@/clients/x";
import { downloadCarouselSlide } from "@/clients/storage";

const MEDIA_PER_TWEET = 4;

export type PublishCarouselResult = {
  carouselId: string;
  rootTweetId: string;
  replyTweetIds: string[];
};

/**
 * Publish a rendered carousel to X.
 *
 * X tweets accept up to 4 images. For carousels with more slides we post the
 * first 4 as the root tweet (with the caption as text) and reply-thread the
 * remaining slides — 4 per reply — using the caption + ` (n/m)` markers so
 * readers can track position in the thread.
 */
export async function publishCarouselToX(args: {
  userId: string;
  carouselId: string;
  agentStepId?: string | null;
}): Promise<PublishCarouselResult> {
  const carousel = (
    await db.select().from(carousels).where(eq(carousels.id, args.carouselId)).limit(1)
  )[0];
  if (!carousel) throw new Error(`Carousel ${args.carouselId} not found`);
  if (carousel.userId !== args.userId) {
    throw new Error("Carousel does not belong to user");
  }
  if (carousel.status !== "rendered" && carousel.status !== "partial") {
    throw new Error(
      `Carousel must be rendered before publishing (current status: ${carousel.status})`,
    );
  }

  const slides = await db
    .select()
    .from(carouselSlides)
    .where(eq(carouselSlides.carouselId, args.carouselId))
    .orderBy(asc(carouselSlides.slideNumber));
  if (slides.length === 0) throw new Error("Carousel has no slides");

  const renderable = slides.filter((s) => s.imageStoragePath);
  if (renderable.length === 0) {
    throw new Error("No slides have rendered PNGs to upload");
  }

  const xClient = await getXClientForUser(args.userId);
  const caption = carousel.caption ?? "";

  // Upload all PNGs in order.
  const mediaIds: string[] = [];
  for (const slide of renderable) {
    if (!slide.imageStoragePath) continue;
    const png = await downloadCarouselSlide(slide.imageStoragePath);
    const mimeType = "image/png";
    const result = await xClient.uploadMedia(png, mimeType, {
      ...(args.agentStepId !== undefined && args.agentStepId !== null
        ? { agentStepId: args.agentStepId }
        : {}),
    });
    mediaIds.push(result.media_id_string);
  }

  // Chunk media ids into groups of MEDIA_PER_TWEET.
  const chunks: string[][] = [];
  for (let i = 0; i < mediaIds.length; i += MEDIA_PER_TWEET) {
    chunks.push(mediaIds.slice(i, i + MEDIA_PER_TWEET));
  }

  const head = chunks[0];
  if (!head) throw new Error("No media to publish");
  const totalParts = chunks.length;
  const partLabel = (i: number) => (totalParts > 1 ? ` (${i + 1}/${totalParts})` : "");

  const root = await xClient.tweet(
    { text: `${caption}${partLabel(0)}`, media: { media_ids: head } },
    args.agentStepId ? { agentStepId: args.agentStepId } : undefined,
  );

  const replyTweetIds: string[] = [];
  let prevId = root.id;
  for (let i = 1; i < chunks.length; i++) {
    const ids = chunks[i]!;
    const r = await xClient.tweet(
      {
        text: `${caption}${partLabel(i)}`,
        media: { media_ids: ids },
        reply: { in_reply_to_tweet_id: prevId },
      },
      args.agentStepId ? { agentStepId: args.agentStepId } : undefined,
    );
    replyTweetIds.push(r.id);
    prevId = r.id;
  }

  await db
    .update(carousels)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(carousels.id, args.carouselId));

  return { carouselId: args.carouselId, rootTweetId: root.id, replyTweetIds };
}
