"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";
import { buildXIntentUrl } from "@/lib/x-intent";

/**
 * Dashboard widget for the X Web Intent flow. Paste / type any text — the
 * agent's draft, your own copy, anything — click Post to X, the X composer
 * opens in a new tab with the text pre-filled. The user clicks Post inside X
 * themselves; no API, no OAuth.
 *
 * Accepts a `?draft=` query param so per-post "Use this draft" actions on the
 * runs / calendar / posts pages can land here pre-filled.
 */
export function QuickPostCard() {
  const search = useSearchParams();
  const draftParam = search.get("draft") ?? "";
  const [text, setText] = useState(draftParam);
  const [opened, setOpened] = useState(false);

  // If the user navigates here from a "Use this draft" action, the draft
  // param may show up after mount — sync it in once.
  useEffect(() => {
    if (draftParam && draftParam !== text) {
      setText(draftParam);
      setOpened(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftParam]);

  const chars = text.length;
  const overLimit = chars > 280;
  const empty = text.trim().length === 0;

  function onPost() {
    if (empty) return;
    window.open(
      buildXIntentUrl({ text }),
      "_blank",
      "noopener,noreferrer",
    );
    setOpened(true);
  }

  return (
    <section
      id="quick-post"
      className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)] scroll-mt-20"
    >
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-medium tracking-tight">
            <Sparkles size={14} className="-mt-0.5 mr-1 inline text-violet-500" />
            Quick post to X
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Paste the agent&apos;s draft (or write your own). Clicking{" "}
            <strong>Post to X</strong> opens the composer pre-filled — no API,
            no OAuth.
          </p>
        </div>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            overLimit ? "text-red-600" : "text-neutral-500"
          }`}
        >
          {chars}/280
        </span>
      </header>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (opened) setOpened(false);
        }}
        rows={4}
        placeholder="Your first 100 followers don't come from going viral. They come from being unmistakably specific…"
        className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/*
          Plain <button> so the click handler fires synchronously and no
          framer-motion intercepts the event. Tailwind handles the styling.
        */}
        <button
          type="button"
          disabled={empty}
          onClick={onPost}
          title={
            empty
              ? "Type or paste a draft above to enable."
              : "Opens X with your text ready — just hit Post."
          }
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(110,86,248,0.2)] transition hover:bg-violet-700 hover:shadow-[0_8px_24px_rgba(110,86,248,0.25)] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
        >
          <ExternalLink size={14} />
          Post to X
        </button>
        {empty && (
          <span className="text-xs text-neutral-500">
            Type or paste a draft above to enable.
          </span>
        )}
        {!empty && !opened && overLimit && (
          <span className="text-xs text-red-600">
            Over 280 — X may truncate.
          </span>
        )}
        {opened && (
          <span className="text-xs text-violet-700">
            Opened X in a new tab. Hit <strong>Post</strong> there to ship it.
          </span>
        )}
      </div>
    </section>
  );
}
