"use client";

import { motion } from "framer-motion";
import { AGENT_ORDER, AGENTS, type AgentKey } from "@/lib/mock";
import { AgentIcon } from "@/components/ui/agent-icon";
import { PillBadge } from "@/components/ui/pill-badge";

const TIMELINE: { agentKey: AgentKey; status: string; line: string }[] = [
  { agentKey: "research", status: "completed", line: "Pulled 23 sources from X + 4 newsletters." },
  { agentKey: "pattern", status: "completed", line: "Matched 4 patterns. Found one new: 'index-card take'." },
  { agentKey: "strategy", status: "completed", line: "Composed 5 posts + 1 carousel for the week." },
  { agentKey: "copy", status: "completed", line: "Drafted 3 variants per slot. Selected best." },
  { agentKey: "voice", status: "running", line: "Rewriting in your voice — match 8.4/10…" },
  { agentKey: "quality", status: "pending", line: "Will score originality, hook, brand fit." },
];

export function AgentTimelineMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto mt-16 w-full max-w-3xl"
    >
      <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-violet-300/40 via-orange-200/40 to-amber-200/40 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/90 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-5 py-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400 pulse-dot" />
            <span className="font-medium tracking-tight text-neutral-700">
              Growth run · AI productivity for indie founders
            </span>
          </div>
          <span className="hidden tabular-nums sm:inline">
            00:01:47 · {AGENT_ORDER.length} agents
          </span>
        </div>

        <ol className="space-y-1.5 px-5 py-5">
          {TIMELINE.map((step, i) => (
            <motion.li
              key={step.agentKey}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.12, duration: 0.45 }}
              className="flex items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-[var(--surface-elevated)]"
            >
              <AgentIcon agentKey={step.agentKey} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tracking-tight">
                    {AGENTS[step.agentKey].name}
                  </span>
                  <PillBadge
                    tone={
                      step.status === "completed"
                        ? "success"
                        : step.status === "running"
                          ? "violet"
                          : "neutral"
                    }
                  >
                    {step.status}
                  </PillBadge>
                </div>
                <p className="text-xs text-neutral-500">{step.line}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}
