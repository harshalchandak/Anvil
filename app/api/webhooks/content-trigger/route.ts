import type { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, growthRuns, webhookEvents } from "@/db/schema";
import { env } from "@/lib/env";
import { hmacVerify } from "@/lib/crypto";
import { apiError, apiOk } from "@/lib/api";
import { inngest } from "@/inngest/client";

const PayloadSchema = z.object({
  brandProfileId: z.string().uuid(),
  niche: z.string().optional(),
  goal: z.string().optional(),
  triggerSource: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // Read the raw body so signature verification is byte-exact.
  const raw = await request.text();
  const signature = request.headers.get("x-netisize-signature") ?? "";

  if (!hmacVerify(raw, signature, env.WEBHOOK_SIGNING_SECRET)) {
    await db
      .insert(webhookEvents)
      .values({
        source: "content-trigger",
        eventType: "rejected",
        payload: { reason: "bad_signature" },
        signature,
        status: "rejected",
      })
      .catch(() => undefined);
    return apiError("Invalid signature", 401);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return apiError("Body must be JSON", 400);
  }
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("Invalid payload", 400, parsed.error.issues);
  }

  const brand = (
    await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, parsed.data.brandProfileId))
      .limit(1)
  )[0];
  if (!brand) return apiError("Brand profile not found", 404);

  const inserted = await db
    .insert(growthRuns)
    .values({
      userId: brand.userId,
      brandProfileId: brand.id,
      triggerType: "webhook",
      niche: parsed.data.niche ?? brand.niche,
      goal: parsed.data.goal ?? brand.goal,
      status: "pending",
    })
    .returning({ id: growthRuns.id });
  const run = inserted[0];
  if (!run) return apiError("Failed to enqueue run", 500);

  await db.insert(webhookEvents).values({
    source: "content-trigger",
    eventType: "accepted",
    payload: parsed.data as unknown as Record<string, unknown>,
    signature,
    processedAt: new Date(),
    status: "processed",
  });

  await inngest.send({
    name: "growth-run/start",
    data: { growthRunId: run.id },
  });

  return apiOk({ runId: run.id }, 202);
}
