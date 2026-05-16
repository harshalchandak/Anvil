import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "neutral"
  | "violet"
  | "coral"
  | "amber"
  | "success"
  | "warn"
  | "danger"
  | "info";

const toneClass: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  coral: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  warn: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-100",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-100",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

export function PillBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map a post / run status string to a tone. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "published":
    case "completed":
    case "approved":
      return "success";
    case "running":
    case "publishing":
    case "scheduled":
      return "violet";
    case "needs_revision":
    case "partial":
      return "amber";
    case "failed":
      return "danger";
    case "draft":
    case "pending":
    default:
      return "neutral";
  }
}
