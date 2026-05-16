import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowLeft, Activity } from "lucide-react";
import { db } from "@/db/client";
import { agentSteps, generatedPosts, growthRuns } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { RunSplitView } from "./run-split-view";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const run = await tryDbQuery(
    async () =>
      (
        await db
          .select()
          .from(growthRuns)
          .where(and(eq(growthRuns.id, id), eq(growthRuns.userId, appUser.id)))
          .limit(1)
      )[0] ?? null,
    null,
  );

  if (!run) notFound();

  const steps = await tryDbQuery(
    () =>
      db
        .select()
        .from(agentSteps)
        .where(eq(agentSteps.growthRunId, id))
        .orderBy(asc(agentSteps.startedAt)),
    [],
  );

  const posts = await tryDbQuery(
    () =>
      db
        .select()
        .from(generatedPosts)
        .where(eq(generatedPosts.growthRunId, id))
        .orderBy(desc(generatedPosts.createdAt)),
    [],
  );

  const niche = run.niche ?? "Growth run";
  const status = run.status;
  const timeline = steps.map((s, i) => ({
    id: s.id,
    agentKey:
      (s.agentName as
        | "research"
        | "pattern"
        | "strategy"
        | "copy"
        | "voice"
        | "carousel"
        | "quality"
        | "analytics") ?? "research",
    stepName: s.stepName,
    status: s.status as "pending" | "running" | "completed" | "failed",
    durationMs: s.durationMs ?? null,
    message: s.error ?? `step ${i + 1} complete`,
  }));

  const previewPosts = posts.slice(0, 6).map((p) => ({
    id: p.id,
    text: p.text,
    format: p.format,
    status: p.status,
    scheduledForIso: p.scheduledFor?.toISOString() ?? new Date().toISOString(),
    scores:
      (p.scoresJson as {
        hook?: number;
        clarity?: number;
        originality?: number;
        brandFit?: number;
        humanLikeness?: number;
      } | null) ?? null,
    reasoning: p.reasoning,
    riskNotes: p.riskNotes,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-800"
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{niche}</h1>
          <p className="text-sm text-neutral-500">
            Run ID <code className="text-neutral-400">{id}</code>
          </p>
        </div>
        <Link
          href={`/traces/${id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white px-3.5 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50"
        >
          <Activity size={12} />
          View traces
        </Link>
      </header>
      <RunSplitView
        runStatus={status}
        timeline={timeline}
        previewPosts={previewPosts}
      />
    </div>
  );
}
