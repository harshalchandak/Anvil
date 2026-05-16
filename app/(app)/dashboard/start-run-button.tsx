"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

/**
 * Hackathon-mode "Start growth run":
 *   click → POST /api/quick-generate → server picks the brand, generates one
 *   tweet (via LLM if a key is configured, else a brand-aware template), and
 *   returns { text }. We push the text into the dashboard via ?draft= so the
 *   Quick Post box pre-fills. One click → composer-ready text. One more
 *   click on "Post to X" → X opens with the text pre-filled.
 */
export function StartRunButton({
  brandProfileId,
  disabled,
}: {
  brandProfileId: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    if (!brandProfileId) {
      setError("Configure your brand profile first.");
      return;
    }
    start(async () => {
      const res = await fetch("/api/quick-generate", { method: "POST" });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; data: { text: string; source: "llm" | "template" } }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !json || !json.ok) {
        setError(
          json && "error" in json
            ? json.error
            : "Couldn't generate a post. Save your brand at /brand and try again.",
        );
        return;
      }
      const draft = json.data.text;
      // Push to the dashboard with the draft pre-filled. The QuickPostCard
      // reads ?draft= and hydrates the textarea.
      router.push(`/dashboard?draft=${encodeURIComponent(draft)}#quick-post`);
      // Force a re-read so the page picks up the new ?draft.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <GradientButton
        type="button"
        onClick={go}
        disabled={pending || disabled}
        variant="gradient"
        size="lg"
        title={disabled ? "Configure your brand profile first." : undefined}
      >
        {pending ? (
          "Drafting your post…"
        ) : (
          <>
            <Sparkles size={16} />
            Start growth run
            <ArrowRight size={14} />
          </>
        )}
      </GradientButton>
      {error && (
        <span className="max-w-xs text-right text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
