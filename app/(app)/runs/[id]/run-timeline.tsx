"use client";

import { useEffect, useState } from "react";

type Step = {
  id: string;
  parentStepId: string | null;
  agentName: string;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed" | "retrying" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  retryCount: number;
};

type ApiResponse =
  | { ok: true; data: { steps: Step[] } }
  | { ok: false; error: string };

export function RunTimeline({
  runId,
  initialSteps,
  terminal,
}: {
  runId: string;
  initialSteps: unknown[];
  terminal: boolean;
}) {
  const [steps, setSteps] = useState<Step[]>(toSteps(initialSteps));
  const [stopped, setStopped] = useState(terminal);

  useEffect(() => {
    if (stopped) return;
    let cancelled = false;
    const tick = async () => {
      const res = await fetch(`/api/growth-runs/${runId}/steps`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as ApiResponse;
      if (!json.ok || cancelled) return;
      setSteps(json.data.steps);
      const anyRunning = json.data.steps.some(
        (s) => s.status === "running" || s.status === "pending" || s.status === "retrying",
      );
      if (!anyRunning && json.data.steps.length > 0) setStopped(true);
    };
    const handle = setInterval(tick, 2000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [runId, stopped]);

  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-sm text-neutral-400">
        Waiting for the pipeline to start writing its first step…
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Agent timeline</h2>
      <ol className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <StatusDot status={s.status} />
              <div>
                <div className="text-sm font-medium text-neutral-100">
                  {s.agentName} · {s.stepName}
                </div>
                {s.error && (
                  <div className="mt-0.5 text-xs text-red-300">{s.error}</div>
                )}
                <div className="mt-0.5 text-xs text-neutral-500">
                  {s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : "—"}
                  {s.durationMs != null ? ` · ${Math.round(s.durationMs)}ms` : ""}
                  {s.retryCount > 0 ? ` · retried ${s.retryCount}x` : ""}
                </div>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPalette(s.status)}`}>
              {s.status}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function toSteps(input: unknown[]): Step[] {
  return input.map((row) => {
    const s = row as Record<string, unknown>;
    return {
      id: String(s["id"]),
      parentStepId: (s["parentStepId"] as string | null) ?? null,
      agentName: String(s["agentName"]),
      stepName: String(s["stepName"]),
      status: s["status"] as Step["status"],
      startedAt:
        s["startedAt"] instanceof Date
          ? s["startedAt"].toISOString()
          : (s["startedAt"] as string | null) ?? null,
      completedAt:
        s["completedAt"] instanceof Date
          ? s["completedAt"].toISOString()
          : (s["completedAt"] as string | null) ?? null,
      durationMs: (s["durationMs"] as number | null) ?? null,
      error: (s["error"] as string | null) ?? null,
      retryCount: (s["retryCount"] as number | null) ?? 0,
    };
  });
}

function StatusDot({ status }: { status: Step["status"] }) {
  const color =
    status === "completed"
      ? "bg-emerald-400"
      : status === "running"
        ? "bg-amber-300 animate-pulse"
        : status === "failed"
          ? "bg-red-400"
          : "bg-neutral-500";
  return <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function statusPalette(status: Step["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-900/50 text-emerald-200";
    case "running":
    case "retrying":
      return "bg-amber-900/50 text-amber-200";
    case "failed":
      return "bg-red-900/50 text-red-200";
    case "skipped":
      return "bg-neutral-800 text-neutral-400";
    default:
      return "bg-neutral-800 text-neutral-300";
  }
}
