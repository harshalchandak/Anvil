"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

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
      const res = await fetch("/api/growth-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandProfileId, triggerType: "manual" }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; data: { runId: string } }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !json || !json.ok) {
        setError(
          json && "error" in json
            ? json.error
            : "Couldn't start the run. Check that Supabase is configured.",
        );
        return;
      }
      router.push(`/runs/${json.data.runId}`);
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
          "Spinning up your team…"
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
