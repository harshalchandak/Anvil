import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { growthRuns, traceEvents } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const run = (
    await db
      .select({ id: growthRuns.id })
      .from(growthRuns)
      .where(and(eq(growthRuns.id, id), eq(growthRuns.userId, appUser.id)))
      .limit(1)
  )[0];
  if (!run) return apiError("Growth run not found", 404);

  const traces = await db
    .select()
    .from(traceEvents)
    .where(eq(traceEvents.growthRunId, id))
    .orderBy(asc(traceEvents.ts))
    .limit(1000);

  return apiOk({ traces });
}
