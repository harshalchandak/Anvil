import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { growthRuns } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;
  const row = (
    await db
      .select()
      .from(growthRuns)
      .where(and(eq(growthRuns.id, id), eq(growthRuns.userId, appUser.id)))
      .limit(1)
  )[0];
  if (!row) return apiError("Growth run not found", 404);
  return apiOk({ run: row });
}
