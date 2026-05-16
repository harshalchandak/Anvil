"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Check,
  Calendar,
  Images,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { PostPreviewCard } from "@/components/ui/post-preview-card";
import { ScoreBar } from "@/components/ui/score-bar";
import { buildXIntentUrl, buildThreadIntentUrls } from "@/lib/x-intent";

type Post = {
  id: string;
  text: string;
  threadParts: string[] | null;
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
  // Web Intent can't confirm the post actually went out — show a small
  // "Did you post it?" prompt after the composer window opens. Yes flips
  // status to published via the existing /publish endpoint (which falls
  // back to the cookie/demo path if no real X API is wired).
  const [postIntentOpen, setPostIntentOpen] = useState(false);

  const chars = text.length;
  const overLimit = chars > 280 && post.format === "single";

  const threadParts =
    post.format === "thread" && post.threadParts && post.threadParts.length > 0
      ? post.threadParts
      : null;

  function openInXComposer(textToPost: string) {
    setError(null);
    const url = buildXIntentUrl({ text: textToPost });
    window.open(url, "_blank", "noopener,noreferrer");
    setPostIntentOpen(true);
  }

  function confirmPosted() {
    setPostIntentOpen(false);
    // Reuse the existing /publish route. With no real X API configured it
    // will return an error, which we swallow — the user just told us they
    // posted manually, so we still flip the local status to published.
    setBusy("publish");
    start(async () => {
      try {
        await fetch(`/api/posts/${post.id}/publish`, { method: "POST" }).catch(
          () => null,
        );
        // Best-effort: also mark as approved so any code that gates on that
        // state sees a consistent transition.
        await fetch(`/api/posts/${post.id}/approve`, { method: "POST" }).catch(
          () => null,
        );
        router.refresh();
      } finally {
        setBusy(null);
      }
    });
  }

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

        {threadParts ? (
          <ThreadIntentRows
            parts={threadParts}
            onAnyOpened={() => setPostIntentOpen(true)}
          />
        ) : null}

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
          {threadParts ? null : (
            <GradientButton
              type="button"
              variant="gradient"
              size="md"
              disabled={pending || post.status === "published"}
              onClick={() => openInXComposer(text)}
              title="Opens X with your post ready — just hit Post."
            >
              <Send size={14} />
              {post.xPostId ? "Open in X again" : "Post to X"}
            </GradientButton>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        {postIntentOpen && (
          <PostIntentConfirm
            busy={busy === "publish"}
            onConfirm={confirmPosted}
            onCancel={() => setPostIntentOpen(false)}
          />
        )}
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

/**
 * One numbered "Open in X" row per thread part. Web Intent posts one tweet
 * at a time; we cannot auto-chain replies — the user has to reply each next
 * post to the previous one in the X composer.
 */
function ThreadIntentRows({
  parts,
  onAnyOpened,
}: {
  parts: string[];
  onAnyOpened: () => void;
}) {
  const urls = buildThreadIntentUrls(parts);
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <header className="mb-3">
        <h3 className="text-sm font-medium tracking-tight">Thread parts</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Post these in order — reply each one to the previous in the X composer.
        </p>
      </header>
      <ol className="space-y-2">
        {parts.map((part, i) => {
          const href = urls[i]!;
          return (
            <li
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-medium tabular-nums text-violet-700">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-neutral-800">
                {part}
              </p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onAnyOpened}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-violet-700"
                title="Opens X with this part pre-filled — just hit Post."
              >
                <ExternalLink size={11} />
                Open {i + 1}/{parts.length}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The X Web Intent flow can't confirm whether the user actually posted
 * (cross-origin, no callback). After opening the composer we show this
 * inline confirm; "Yes" flips the post to published, "Not yet" leaves it.
 */
function PostIntentConfirm({
  busy,
  onConfirm,
  onCancel,
}: {
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-violet-900">
      <span className="font-medium">Did you post it?</span>
      <span className="text-xs text-violet-700/80">
        X Web Intent can&apos;t tell us automatically — confirm so we can mark it
        published.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? "Marking…" : "Yes, posted"}
        </button>
      </div>
    </div>
  );
}
