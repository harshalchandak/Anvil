import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentSteps, growthRuns } from "@/db/schema";
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

  const steps = await db
    .select()
    .from(agentSteps)
    .where(eq(agentSteps.growthRunId, id))
    .orderBy(asc(agentSteps.startedAt));

  return apiOk({ steps });
}
