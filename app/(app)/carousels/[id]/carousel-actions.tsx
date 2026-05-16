"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Action = "regenerate" | "publish";

export function CarouselActions({
  carouselId,
  status,
}: {
  carouselId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  function call(action: Action) {
    setError(null);
    setBusy(action);
    start(async () => {
      try {
        const res = await fetch(`/api/carousels/${carouselId}/${action}`, {
          method: "POST",
        });
        const json = (await res.json()) as
          | { ok: true; data: unknown }
          | { ok: false; error: string };
        if (!res.ok || !json.ok) {
          setError("error" in json ? json.error : `Failed to ${action}`);
        } else {
          router.refresh();
        }
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => call("regenerate")}
        className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy === "regenerate" ? "Regenerating…" : "Regenerate"}
      </button>
      <button
        type="button"
        disabled={pending || status === "published"}
        onClick={() => call("publish")}
        className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:opacity-50"
      >
        {busy === "publish" ? "Publishing…" : "Publish to X"}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}
