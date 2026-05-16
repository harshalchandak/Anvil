import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedPosts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const updated = await db
    .update(generatedPosts)
    .set({ status: "approved", updatedAt: new Date() })
    .where(
      and(eq(generatedPosts.id, id), eq(generatedPosts.userId, appUser.id)),
    )
    .returning({ id: generatedPosts.id, status: generatedPosts.status });

  const row = updated[0];
  if (!row) return apiError("Post not found", 404);
  return apiOk({ post: row });
}
