"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AgentIcon } from "./agent-icon";
import { AGENTS, type AgentKey } from "@/lib/mock";
import { PillBadge, statusTone } from "./pill-badge";
import { cn } from "@/lib/cn";

export function TraceNode({
  agentKey,
  stepName,
  status,
  message,
  durationMs,
  delay = 0,
  defaultOpen = false,
}: {
  agentKey: AgentKey;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed";
  message: string;
  durationMs: number | null;
  delay?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const a = AGENTS[agentKey];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className="relative pl-10"
    >
      <span
        className={cn(
          "absolute left-3 top-4 h-2.5 w-2.5 -translate-x-1/2 rounded-full",
          status === "completed" && "bg-emerald-500",
          status === "running" && "bg-amber-400 pulse-dot",
          status === "failed" && "bg-red-500",
          status === "pending" && "bg-neutral-300",
        )}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-left shadow-[0_4px_18px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-start gap-3">
          <AgentIcon agentKey={agentKey} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight">
                {a.name}
              </span>
              <span className="text-xs text-neutral-500">·</span>
              <span className="text-xs text-neutral-500">{stepName}</span>
              <span className="ml-auto inline-flex items-center gap-2">
                <PillBadge tone={statusTone(status)}>{status}</PillBadge>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-neutral-400 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-neutral-600">{message}</p>
          </div>
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          className="mt-2 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span>
              Duration:{" "}
              <strong className="text-neutral-700 tabular-nums">
                {durationMs != null ? `${(durationMs / 1000).toFixed(2)}s` : "—"}
              </strong>
            </span>
            <span>·</span>
            <span>retry 0</span>
          </div>
          <p className="mt-2 text-sm text-neutral-700">{message}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
