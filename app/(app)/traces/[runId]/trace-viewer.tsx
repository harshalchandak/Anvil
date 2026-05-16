"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { AgentIcon } from "@/components/ui/agent-icon";
import type { AgentKey } from "@/lib/mock";

type Step = {
  id: string;
  parentStepId: string | null;
  agentName: string;
  stepName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  retryCount: number;
};

type Trace = {
  id: string;
  agentStepId: string | null;
  level: string;
  message: string;
  ts: string;
};

export function TraceViewer({ steps, traces }: { steps: Step[]; traces: Trace[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const tree = useMemo(() => buildTree(steps), [steps]);
  const tracesByStep = useMemo(() => groupTraces(traces), [traces]);

  if (steps.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/40 p-8 text-sm text-neutral-500">
        No agent steps recorded for this run yet.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {tree.map((node) => (
        <Node
          key={node.step.id}
          node={node}
          depth={0}
          open={open}
          setOpen={setOpen}
          tracesByStep={tracesByStep}
        />
      ))}
    </ol>
  );
}

/**
 * Stable UTC HH:MM:SS — avoids SSR/CSR hydration mismatch caused by
 * `Date.toLocaleTimeString()` defaulting to different locales in node vs the
 * browser.
 */
function formatHMS(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

type TreeNode = { step: Step; children: TreeNode[] };

function buildTree(steps: Step[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const s of steps) byId.set(s.id, { step: s, children: [] });
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.step.parentStepId && byId.has(node.step.parentStepId)) {
      byId.get(node.step.parentStepId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function groupTraces(traces: Trace[]): Record<string, Trace[]> {
  const out: Record<string, Trace[]> = {};
  for (const t of traces) {
    const key = t.agentStepId ?? "__orphan__";
    (out[key] ??= []).push(t);
  }
  return out;
}

function Node({
  node,
  depth,
  open,
  setOpen,
  tracesByStep,
}: {
  node: TreeNode;
  depth: number;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  tracesByStep: Record<string, Trace[]>;
}) {
  const isOpen = open[node.step.id] ?? depth < 1;
  const stepTraces = tracesByStep[node.step.id] ?? [];
  const hasChildren = node.children.length > 0 || stepTraces.length > 0;
  const agentKey = (node.step.agentName as AgentKey) ?? "research";

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((cur) => ({ ...cur, [node.step.id]: !isOpen }))}
        className="group w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex items-center gap-3">
          <AgentIcon agentKey={agentKey} size={32} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium tracking-tight">
              {node.step.agentName} · <span className="text-neutral-500">{node.step.stepName}</span>
            </div>
            <div className="text-xs text-neutral-500">
              {node.step.startedAt ? formatHMS(node.step.startedAt) : "—"}
              {node.step.durationMs != null && (
                <> · <span className="tabular-nums">{node.step.durationMs}ms</span></>
              )}
              {node.step.retryCount > 0 && <> · retried {node.step.retryCount}x</>}
            </div>
          </div>
          <PillBadge tone={statusTone(node.step.status)}>{node.step.status}</PillBadge>
          {hasChildren && (
            <ChevronDown
              size={16}
              className={cn(
                "text-neutral-400 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          )}
        </div>
      </button>
      {node.step.error && (
        <div
          className="ml-12 mt-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
          style={{ marginLeft: depth * 16 + 48 }}
        >
          {node.step.error}
        </div>
      )}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mt-1 space-y-1.5"
        >
          {stepTraces.length > 0 && (
            <div
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 font-mono text-[11px] leading-relaxed text-neutral-700"
              style={{ marginLeft: depth * 16 + 48 }}
            >
              {stepTraces.map((t) => (
                <div key={t.id} className="flex gap-2">
                  <span className="w-14 shrink-0 text-neutral-400">
                    {formatHMS(t.ts)}
                  </span>
                  <span
                    className={cn(
                      "w-10 shrink-0 font-semibold uppercase tracking-wider",
                      t.level === "error" && "text-red-600",
                      t.level === "warn" && "text-amber-600",
                      t.level === "info" && "text-violet-600",
                      t.level === "debug" && "text-neutral-400",
                    )}
                  >
                    {t.level}
                  </span>
                  <span className="text-neutral-700">{t.message}</span>
                </div>
              ))}
            </div>
          )}
          {node.children.length > 0 && (
            <ol className="space-y-2">
              {node.children.map((c) => (
                <Node
                  key={c.step.id}
                  node={c}
                  depth={depth + 1}
                  open={open}
                  setOpen={setOpen}
                  tracesByStep={tracesByStep}
                />
              ))}
            </ol>
          )}
        </motion.div>
      )}
    </li>
  );
}
