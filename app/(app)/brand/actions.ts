"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { brandProfiles } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { setDemoBrand } from "@/lib/demo-brand";

const BodySchema = z.object({
  id: z.string().nullable(),
  niche: z.string().trim().min(2),
  audience: z.string().trim().min(2),
  goal: z.string().trim().min(2),
  tone: z.string().trim().min(2),
  frequency: z.enum(["daily", "every-2-days", "3x-per-week", "weekly"]),
  approvalMode: z.enum(["manual", "autopilot"]),
  sampleStyle: z.string().trim().max(2000).nullable(),
  bannedWordsCsv: z.string().max(500).nullable(),
  competitorsCsv: z.string().max(500).nullable(),
  ctaPreference: z.string().trim().max(200).nullable(),
});

export type BrandActionResult =
  | { ok: true; brandId: string }
  | { ok: false; error: string };

function splitCsv(s: string | null): string[] {
  if (!s) return [];
  return Array.from(
    new Set(
      s
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0),
    ),
  );
}

export async function saveBrandProfile(
  _prev: BrandActionResult | null,
  formData: FormData,
): Promise<BrandActionResult> {
  const { appUser } = await requireAppUser();

  const raw = {
    id: (formData.get("id") as string | null) || null,
    niche: formData.get("niche"),
    audience: formData.get("audience"),
    goal: formData.get("goal"),
    tone: formData.get("tone"),
    frequency: formData.get("frequency"),
    approvalMode: formData.get("approvalMode"),
    sampleStyle: (formData.get("sampleStyle") as string | null) || null,
    bannedWordsCsv: (formData.get("bannedWordsCsv") as string | null) || null,
    competitorsCsv: (formData.get("competitorsCsv") as string | null) || null,
    ctaPreference: (formData.get("ctaPreference") as string | null) || null,
  };

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form input",
    };
  }
  const data = parsed.data;

  const dbValues = {
    userId: appUser.id,
    niche: data.niche,
    audience: data.audience,
    goal: data.goal,
    tone: data.tone,
    frequency: data.frequency,
    approvalMode: data.approvalMode,
    sampleStyle: data.sampleStyle,
    bannedWords: splitCsv(data.bannedWordsCsv),
    competitors: splitCsv(data.competitorsCsv),
    ctaPreference: data.ctaPreference,
  };

  // Try to persist to Postgres. If it throws (placeholder DATABASE_URL or
  // Supabase unreachable), fall back to a signed cookie so the user's brand
  // profile survives refresh in demo mode.
  let brandId: string | null = null;
  try {
    if (data.id && isUuid(data.id)) {
      const updated = await db
        .update(brandProfiles)
        .set({ ...dbValues, updatedAt: new Date() })
        .where(eq(brandProfiles.id, data.id))
        .returning({ id: brandProfiles.id });
      const row = updated[0];
      if (!row) return { ok: false, error: "Brand profile not found" };
      brandId = row.id;
    } else {
      const inserted = await db
        .insert(brandProfiles)
        .values(dbValues)
        .returning({ id: brandProfiles.id });
      const row = inserted[0];
      if (!row) throw new Error("Insert returned no row");
      brandId = row.id;
    }
  } catch (err) {
    // DB unavailable — persist via cookie so the user keeps their work.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[netisize] brand DB write failed, persisting to demo cookie:",
        err instanceof Error ? err.message : String(err),
      );
    }
    const cookieId = isUuid(data.id ?? "") ? data.id! : randomUUID();
    await setDemoBrand({
      id: cookieId,
      niche: data.niche,
      audience: data.audience,
      goal: data.goal,
      tone: data.tone,
      frequency: data.frequency,
      approvalMode: data.approvalMode,
      sampleStyle: data.sampleStyle ?? "",
      bannedWords: dbValues.bannedWords,
      competitors: dbValues.competitors,
      ctaPreference: data.ctaPreference ?? "",
    });
    brandId = cookieId;
  }

  revalidatePath("/brand");
  revalidatePath("/dashboard");
  return { ok: true, brandId };
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
