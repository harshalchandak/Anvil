import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/40 px-8 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-500">
          {icon}
        </span>
      )}
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
