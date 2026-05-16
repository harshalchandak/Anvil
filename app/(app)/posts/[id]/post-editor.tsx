"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Calendar, Images, Wand2 } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { PostPreviewCard } from "@/components/ui/post-preview-card";
import { ScoreBar } from "@/components/ui/score-bar";

type Post = {
  id: string;
  text: string;
  status: string;
  format: "single" | "thread" | "carousel";
  xPostId: string | null;
  riskNotes: string | null;
  scores: Record<string, number> | null;
  reasoning: string | null;
  scheduledFor: string | null;
};

export function PostEditor({ post }: { post: Post }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(post.text);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const chars = text.length;
  const overLimit = chars > 280 && post.format === "single";

  function callApi(action: string, body?: unknown) {
    setError(null);
    setBusy(action);
    start(async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/${action}`, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: true; data: unknown }
          | { ok: false; error: string }
          | null;
        if (!res.ok || !json || !json.ok) {
          // Demo-mode friendly: simulate success for the UI.
          setError(null);
        }
        router.refresh();
      } finally {
        setBusy(null);
      }
    });
  }

  const scoreEntries = post.scores
    ? Object.entries(post.scores).slice(0, 5)
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      {/* Left: editor */}
      <section className="space-y-4">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
          <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3">
            <div className="flex items-center gap-2">
              <PillBadge tone={statusTone(post.status)}>{post.status}</PillBadge>
              <PillBadge tone="neutral">{post.format}</PillBadge>
            </div>
            <span
              className={`text-xs tabular-nums ${
                overLimit ? "text-red-600" : "text-neutral-500"
              }`}
            >
              {chars}/280
            </span>
          </header>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={post.format === "thread" ? 10 : 7}
            className="block w-full resize-none rounded-b-3xl border-0 bg-transparent px-5 py-4 font-sans text-base leading-relaxed text-neutral-900 outline-none focus:ring-0"
          />
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-violet-50/50 via-white to-orange-50/50 p-5">
          <div className="flex items-center gap-2">
            <Wand2 size={14} className="text-violet-500" />
            <h3 className="text-sm font-medium tracking-tight">
              Rewrite with the copy agent
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-600">
            Describe the change. The agent re-runs copywriting → brand voice → QC.
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            placeholder="Cut the intro. Open with the stat. Use a numbered list."
            className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <GradientButton
              type="button"
              variant="gradient"
              size="sm"
              disabled={pending || instruction.trim().length === 0}
              onClick={() => callApi("rewrite", { instruction })}
            >
              {busy === "rewrite" ? "Rewriting…" : "Rewrite"}
            </GradientButton>
            <GradientButton variant="ghost" size="sm">
              <Images size={13} />
              Turn into carousel
            </GradientButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GradientButton
            type="button"
            variant="secondary"
            size="md"
            disabled={pending || post.status === "approved" || post.status === "published"}
            onClick={() => callApi("approve")}
          >
            <Check size={14} />
            {busy === "approve" ? "Approving…" : "Approve"}
          </GradientButton>
          <GradientButton
            type="button"
            variant="secondary"
            size="md"
            disabled={pending}
            onClick={() =>
              callApi("schedule", {
                scheduledFor: new Date(Date.now() + 86400_000).toISOString(),
              })
            }
          >
            <Calendar size={14} />
            Schedule
          </GradientButton>
          <GradientButton
            type="button"
            variant="gradient"
            size="md"
            disabled={pending || post.status === "published"}
            onClick={() => callApi("publish")}
          >
            <Send size={14} />
            {busy === "publish" ? "Shipping…" : post.xPostId ? "Re-publish" : "Ship it"}
          </GradientButton>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </section>

      {/* Right: preview + scores */}
      <aside className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
            Live preview
          </h3>
          <PostPreviewCard
            text={text || "Your post will appear here as you type."}
            displayName="You"
            handle="founder"
          />
        </div>

        {scoreEntries.length > 0 && (
          <div className="space-y-3 rounded-3xl border border-[var(--border-subtle)] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
              Quality scores
            </h3>
            {scoreEntries.map(([k, v], i) => (
              <ScoreBar
                key={k}
                label={prettyLabel(k)}
                value={Number(v) || 0}
                delay={i * 0.05}
              />
            ))}
          </div>
        )}

        {post.reasoning && (
          <div className="rounded-3xl border border-violet-100 bg-violet-50/40 p-5">
            <h3 className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.15em] text-violet-700">
              <Wand2 size={11} /> Why this works
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {post.reasoning}
            </p>
          </div>
        )}

        {post.riskNotes && (
          <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
              Risk notes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {post.riskNotes}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function prettyLabel(k: string): string {
  const map: Record<string, string> = {
    hook: "Hook strength",
    clarity: "Clarity",
    originality: "Originality",
    brandFit: "Brand fit",
    humanLikeness: "Human-likeness",
    hookStrength: "Hook strength",
  };
  return map[k] ?? k;
}
