"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function ScoreBar({
  label,
  value,
  max = 10,
  delay = 0,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  delay?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const tone =
    value >= 8
      ? "from-emerald-400 to-emerald-500"
      : value >= 6
        ? "from-violet-400 to-violet-500"
        : "from-amber-400 to-orange-500";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-neutral-700">{label}</span>
        <span className="tabular-nums text-neutral-500">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", tone)}
        />
      </div>
    </div>
  );
}
