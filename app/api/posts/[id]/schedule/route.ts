import type { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedPosts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk, parseJson } from "@/lib/api";

const BodySchema = z.object({
  scheduledFor: z.string().datetime(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const parsed = await parseJson(request, BodySchema);
  if (!parsed.ok) return parsed.response;

  const when = new Date(parsed.data.scheduledFor);
  if (when.getTime() < Date.now() - 60_000) {
    return apiError("scheduledFor must be in the future", 400);
  }

  const updated = await db
    .update(generatedPosts)
    .set({ status: "scheduled", scheduledFor: when, updatedAt: new Date() })
    .where(
      and(eq(generatedPosts.id, id), eq(generatedPosts.userId, appUser.id)),
    )
    .returning({ id: generatedPosts.id, scheduledFor: generatedPosts.scheduledFor });

  const row = updated[0];
  if (!row) return apiError("Post not found", 404);
  return apiOk({ post: row });
}
