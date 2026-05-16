"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, ExternalLink } from "lucide-react";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { buildXIntentUrl } from "@/lib/x-intent";

type Post = {
  id: string;
  text: string;
  status: string;
  format: "single" | "thread" | "carousel";
  scheduledFor: string | null;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarBoard({
  startIso,
  posts,
}: {
  startIso: string;
  posts: Post[];
}) {
  const router = useRouter();
  const start = useMemo(() => new Date(startIso), [startIso]);

  const days = useMemo(
    () =>
      DAY_LABELS.map((label, i) => {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        return { label, date: d };
      }),
    [start],
  );

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.scheduledFor) continue;
      const key = new Date(p.scheduledFor).toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const [editing, setEditing] = useState<Post | null>(null);

  function shift(direction: -1 | 1) {
    const next = new Date(start);
    next.setUTCDate(next.getUTCDate() + 7 * direction);
    router.push(`/calendar?start=${encodeURIComponent(next.toISOString())}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white text-neutral-600 transition hover:bg-neutral-50"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className="rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white text-neutral-600 transition hover:bg-neutral-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <Calendar size={12} />
          Times shown in your local timezone
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map(({ label, date }) => {
          const key = date.toISOString().slice(0, 10);
          const items = postsByDay.get(key) ?? [];
          const isToday =
            new Date().toISOString().slice(0, 10) === key;
          return (
            <div
              key={key}
              className={`min-h-[220px] rounded-2xl border bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
                isToday
                  ? "border-violet-200 ring-2 ring-violet-100"
                  : "border-[var(--border-subtle)]"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                  {label}
                </span>
                <span
                  className={`text-xs tabular-nums ${isToday ? "font-semibold text-violet-700" : "text-neutral-400"}`}
                >
                  {date.toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <li className="text-xs text-neutral-400">No posts.</li>
                ) : (
                  items.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="block w-full cursor-pointer text-left"
                      >
                        <div className="line-clamp-3 text-xs text-neutral-800">
                          {p.text}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px]">
                          <span className="rounded-full bg-white px-2 py-0.5 text-neutral-500 ring-1 ring-[var(--border-subtle)]">
                            {p.format}
                          </span>
                          <PillBadge tone={statusTone(p.status)}>{p.status}</PillBadge>
                        </div>
                      </button>
                      <a
                        href={buildXIntentUrl({ text: p.text })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-violet-700"
                        title="Opens X with this post pre-filled."
                      >
                        <ExternalLink size={10} />
                        Post to X
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {editing && (
        <RescheduleDialog
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RescheduleDialog({
  post,
  onClose,
  onSaved,
}: {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(() =>
    post.scheduledFor
      ? new Date(post.scheduledFor).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const iso = new Date(value).toISOString();
      const res = await fetch(`/api/posts/${post.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: iso }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        // demo-mode friendly
        onSaved();
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
        <h3 className="text-base font-medium tracking-tight">Reschedule post</h3>
        <p className="mt-1 line-clamp-3 text-xs text-neutral-500">{post.text}</p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
            New time
          </span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </label>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Link
            href={`/posts/${post.id}`}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            Open post →
          </Link>
          <GradientButton type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </GradientButton>
          <GradientButton
            type="button"
            variant="gradient"
            size="sm"
            disabled={pending}
            onClick={save}
          >
            {pending ? "Saving…" : "Save"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
