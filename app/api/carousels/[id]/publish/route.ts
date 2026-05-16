import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { xAccounts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";
import { publishCarouselToX } from "@/clients/x-carousel";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const xa = (
    await db
      .select({ id: xAccounts.id })
      .from(xAccounts)
      .where(eq(xAccounts.userId, appUser.id))
      .limit(1)
  )[0];
  if (!xa) return apiError("Connect your X account before publishing", 412);

  try {
    const result = await publishCarouselToX({
      userId: appUser.id,
      carouselId: id,
    });
    return apiOk({ carouselId: result.carouselId, rootTweetId: result.rootTweetId, replyTweetIds: result.replyTweetIds });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : String(err),
      err instanceof Error && err.message.includes("not found") ? 404 : 502,
    );
  }
}
