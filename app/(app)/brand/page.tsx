import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { getDemoBrand } from "@/lib/demo-brand";
import { BrandForm, type BrandInitial } from "./brand-form";

export default async function BrandPage() {
  const { appUser } = await requireAppUser();

  const existing = await tryDbQuery<typeof brandProfiles.$inferSelect | null>(
    async () =>
      (
        await db
          .select()
          .from(brandProfiles)
          .where(eq(brandProfiles.userId, appUser.id))
          .limit(1)
      )[0] ?? null,
    null,
  );

  // Hydrate from DB if available, otherwise from the demo cookie so the
  // user's last-saved profile survives page refresh in demo mode.
  let initial: BrandInitial = null;
  if (existing) {
    initial = {
      id: existing.id,
      niche: existing.niche,
      audience: existing.audience,
      goal: existing.goal,
      tone: existing.tone,
      frequency: existing.frequency,
      approvalMode: existing.approvalMode,
      sampleStyle: existing.sampleStyle ?? "",
      bannedWordsCsv: (existing.bannedWords ?? []).join(", "),
      competitorsCsv: (existing.competitors ?? []).join(", "),
      ctaPreference: existing.ctaPreference ?? "",
    };
  } else {
    const cookie = await getDemoBrand();
    if (cookie) {
      initial = {
        id: cookie.id,
        niche: cookie.niche,
        audience: cookie.audience,
        goal: cookie.goal,
        tone: cookie.tone,
        frequency: cookie.frequency,
        approvalMode: cookie.approvalMode,
        sampleStyle: cookie.sampleStyle,
        bannedWordsCsv: cookie.bannedWords.join(", "),
        competitorsCsv: cookie.competitors.join(", "),
        ctaPreference: cookie.ctaPreference,
      };
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Brand
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Tell your AI team{" "}
          <span className="font-display italic text-neutral-500">who you are</span>.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Niche, voice, and guardrails. Every growth run uses these — change
          them whenever your strategy shifts.
        </p>
      </header>
      <BrandForm initial={initial} />
    </div>
  );
}
