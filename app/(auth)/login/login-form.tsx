"use client";

import { useActionState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import {
  signInWithPassword,
  type AuthActionResult,
} from "@/lib/auth-actions";
import { GradientButton } from "@/components/ui/gradient-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthActionResult | null, FormData>(
    signInWithPassword,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@founder.dev"
        icon={<Mail size={14} />}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />
      {state && !state.ok && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <GradientButton
        type="submit"
        variant="gradient"
        size="md"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Signing in…" : "Continue"}
        <ArrowRight size={14} />
      </GradientButton>
      <p className="text-center text-xs text-neutral-500">
        We&apos;ll keep you signed in for 7 days on this device.
      </p>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
};

function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  required,
  icon,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </span>
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
        )}
        <input
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 ${
            icon ? "pl-9" : ""
          }`}
        />
      </span>
    </label>
  );
}
