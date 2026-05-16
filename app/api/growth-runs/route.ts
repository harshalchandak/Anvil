import type { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, growthRuns } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { inngest } from "@/inngest/client";

const CreateBodySchema = z.object({
  brandProfileId: z.string().uuid(),
  triggerType: z.enum(["manual", "webhook", "scheduled"]).default("manual"),
});

export async function GET() {
  const { appUser } = await requireAppUser();
  const rows = await db
    .select()
    .from(growthRuns)
    .where(eq(growthRuns.userId, appUser.id))
    .orderBy(desc(growthRuns.createdAt))
    .limit(50);
  return apiOk({ runs: rows });
}

export async function POST(request: NextRequest) {
  const { appUser } = await requireAppUser();

  const parsed = await parseJson(request, CreateBodySchema);
  if (!parsed.ok) return parsed.response;

  // Confirm the brand belongs to this user.
  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(
        and(
          eq(brandProfiles.id, parsed.data.brandProfileId),
          eq(brandProfiles.userId, appUser.id),
        ),
      )
      .limit(1)
  )[0];
  if (!brand) return apiError("Brand profile not found", 404);

  const inserted = await db
    .insert(growthRuns)
    .values({
      userId: appUser.id,
      brandProfileId: brand.id,
      triggerType: parsed.data.triggerType,
      niche: brand.niche,
      goal: brand.goal,
      status: "pending",
    })
    .returning({ id: growthRuns.id });
  const row = inserted[0];
  if (!row) return apiError("Failed to create growth run", 500);

  await inngest.send({
    name: "growth-run/start",
    data: { growthRunId: row.id },
  });

  return apiOk({ runId: row.id }, 201);
}
