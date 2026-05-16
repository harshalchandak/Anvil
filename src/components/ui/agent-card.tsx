"use client";

import { motion } from "framer-motion";
import { AGENTS, type AgentKey } from "@/lib/mock";
import { AgentIcon } from "./agent-icon";

export function AgentCard({
  agentKey,
  delay = 0,
}: {
  agentKey: AgentKey;
  delay?: number;
}) {
  const a = AGENTS[agentKey];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col gap-4 rounded-2xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(110,86,248,0.06), rgba(255,122,89,0.06))",
        }}
      />
      <div className="flex items-center gap-3">
        <AgentIcon agentKey={agentKey} size={44} />
        <div>
          <div className="text-base font-medium tracking-tight">{a.name}</div>
          <div className="text-xs text-neutral-500">{a.role}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-neutral-600">{a.tagline}</p>
    </motion.div>
  );
}
