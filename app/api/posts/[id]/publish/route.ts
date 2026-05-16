import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedPosts, xAccounts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";
import { getXClientForUser } from "@/clients/x";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const post = (
    await db
      .select()
      .from(generatedPosts)
      .where(
        and(eq(generatedPosts.id, id), eq(generatedPosts.userId, appUser.id)),
      )
      .limit(1)
  )[0];
  if (!post) return apiError("Post not found", 404);
  if (post.status === "published") {
    return apiError("Post already published", 409);
  }

  // Require an X account.
  const xa = (
    await db
      .select({ id: xAccounts.id })
      .from(xAccounts)
      .where(eq(xAccounts.userId, appUser.id))
      .limit(1)
  )[0];
  if (!xa) {
    return apiError("Connect your X account before publishing", 412);
  }

  await db
    .update(generatedPosts)
    .set({ status: "publishing", updatedAt: new Date() })
    .where(eq(generatedPosts.id, id));

  try {
    const xClient = await getXClientForUser(appUser.id);
    const res = await xClient.tweet({ text: post.text });
    await db
      .update(generatedPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        xPostId: res.id,
        updatedAt: new Date(),
      })
      .where(eq(generatedPosts.id, id));
    return apiOk({ post: { id, status: "published", xPostId: res.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(generatedPosts)
      .set({ status: "failed", riskNotes: message, updatedAt: new Date() })
      .where(eq(generatedPosts.id, id));
    return apiError(`Publish failed: ${message}`, 502);
  }
}
