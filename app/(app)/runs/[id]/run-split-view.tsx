"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TraceNode } from "@/components/ui/trace-node";
import { PostPreviewCard } from "@/components/ui/post-preview-card";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import type { AgentKey } from "@/lib/mock";

type Step = {
  id: string;
  agentKey: AgentKey;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed";
  durationMs: number | null;
  message: string;
};

type Post = {
  id: string;
  text: string;
  format: "single" | "thread" | "carousel";
  status: string;
  scheduledForIso: string;
  scores: {
    hook?: number;
    clarity?: number;
    originality?: number;
    brandFit?: number;
    humanLikeness?: number;
  } | null;
  reasoning: string | null;
  riskNotes: string | null;
};

export function RunSplitView({
  runStatus,
  timeline,
  previewPosts,
}: {
  runStatus: string;
  timeline: Step[];
  previewPosts: Post[];
}) {
  const totalSteps = timeline.length || 1;
  const doneSteps = useMemo(
    () => timeline.filter((s) => s.status === "completed").length,
    [timeline],
  );
  const [progress, setProgress] = useState((doneSteps / totalSteps) * 100);

  // Smoothly animate the progress ring to the new value.
  useEffect(() => {
    const target = (doneSteps / totalSteps) * 100;
    const id = window.setTimeout(() => setProgress(target), 80);
    return () => window.clearTimeout(id);
  }, [doneSteps, totalSteps]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      {/* Left: timeline */}
      <section className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium tracking-tight">
            Agent timeline
          </h2>
          <PillBadge tone={statusTone(runStatus)}>{runStatus}</PillBadge>
        </div>

        <div className="relative">
          {/* vertical guide line */}
          <span
            aria-hidden
            className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-violet-200 via-orange-200 to-amber-200"
          />
          <ol className="space-y-3">
            {timeline.map((step, i) => (
              <TraceNode
                key={step.id}
                agentKey={step.agentKey}
                stepName={step.stepName}
                status={step.status}
                message={step.message}
                durationMs={step.durationMs}
                delay={i * 0.06}
                defaultOpen={step.status === "running"}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* Right: output preview */}
      <section className="space-y-4">
        <ProgressCard
          progress={progress}
          completed={doneSteps}
          total={totalSteps}
          previewCount={previewPosts.length}
        />
        <div className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-500">
            Output preview
          </h3>
          {previewPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/40 p-8 text-center text-sm text-neutral-500">
              Drafts appear here as the copywriting and brand voice agents land.
            </div>
          ) : (
            <ol className="space-y-3">
              {previewPosts.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <Link href={`/posts/${p.id}`} className="block">
                    <PostPreviewCard
                      text={p.text.slice(0, 280)}
                      displayName="You"
                      handle="founder"
                      avatarHue={260 + i * 30}
                    />
                  </Link>
                </motion.li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

function ProgressCard({
  progress,
  completed,
  total,
  previewCount,
}: {
  progress: number;
  completed: number;
  total: number;
  previewCount: number;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-violet-50 via-white to-orange-50 p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <svg
        width={72}
        height={72}
        viewBox="0 0 72 72"
        className="-rotate-90"
      >
        <circle cx="36" cy="36" r={r} stroke="#ECE9E0" strokeWidth="6" fill="none" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          stroke="url(#progressGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6E56F8" />
            <stop offset="100%" stopColor="#FF7A59" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.15em] text-violet-700">
          Your AI team is thinking
        </div>
        <div className="mt-1 text-lg font-medium tracking-tight">
          {completed} of {total} agents done
        </div>
        <div className="text-xs text-neutral-500">
          {previewCount} draft{previewCount === 1 ? "" : "s"} ready to review
        </div>
      </div>
    </div>
  );
}
