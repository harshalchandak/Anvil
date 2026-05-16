import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db/client";
import { agentSteps, growthRuns, traceEvents } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { TraceViewer } from "./trace-viewer";

export default async function TracePage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { appUser } = await requireAppUser();
  const { runId } = await params;

  const run = await tryDbQuery(
    async () =>
      (
        await db
          .select({ id: growthRuns.id, niche: growthRuns.niche })
          .from(growthRuns)
          .where(and(eq(growthRuns.id, runId), eq(growthRuns.userId, appUser.id)))
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
        .where(eq(agentSteps.growthRunId, runId))
        .orderBy(asc(agentSteps.startedAt)),
    [],
  );

  const traces = await tryDbQuery(
    () =>
      db
        .select()
        .from(traceEvents)
        .where(eq(traceEvents.growthRunId, runId))
        .orderBy(asc(traceEvents.ts))
        .limit(2000),
    [],
  );

  const stepRows = steps.map((s) => ({
    id: s.id,
    parentStepId: s.parentStepId,
    agentName: s.agentName,
    stepName: s.stepName,
    status: s.status,
    startedAt: s.startedAt?.toISOString() ?? null,
    completedAt: s.completedAt?.toISOString() ?? null,
    durationMs: s.durationMs,
    error: s.error,
    retryCount: s.retryCount,
  }));

  const traceRows = traces.map((t) => ({
    id: t.id,
    agentStepId: t.agentStepId,
    level: t.level,
    message: t.message,
    ts: t.ts.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/runs/${runId}`}
          className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-800"
        >
          <ArrowLeft size={12} /> Back to run
        </Link>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Traces · <span className="text-neutral-500">{run.niche ?? "Growth run"}</span>
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Every agent step, every tool call, every log line.
        </p>
      </header>
      <TraceViewer steps={stepRows} traces={traceRows} />
    </div>
  );
}
