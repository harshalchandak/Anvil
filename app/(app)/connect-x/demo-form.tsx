"use client";

import { useActionState } from "react";
import { AtSign, ArrowRight } from "lucide-react";
import {
  connectXDemo,
  type ConnectDemoResult,
} from "./actions";
import { GradientButton } from "@/components/ui/gradient-button";

export function ConnectXDemoForm() {
  const [state, action, pending] = useActionState<ConnectDemoResult | null, FormData>(
    connectXDemo,
    null,
  );
  return (
    <form
      action={action}
      className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
          Your X handle
        </span>
        <span className="relative block">
          <AtSign
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            name="handle"
            placeholder="founder"
            required
            autoFocus
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 pl-9 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </span>
        <span className="mt-1 block text-xs text-neutral-500">
          Without the @. Letters, numbers, underscores only.
        </span>
      </label>

      {state && !state.ok && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <GradientButton type="submit" variant="gradient" disabled={pending}>
          {pending ? "Connecting…" : "Connect (demo)"}
          <ArrowRight size={14} />
        </GradientButton>
      </div>
    </form>
  );
}
