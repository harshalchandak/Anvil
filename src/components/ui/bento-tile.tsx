"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Size = "1x1" | "2x1" | "1x2" | "2x2";

const sizeClass: Record<Size, string> = {
  "1x1": "md:col-span-1 md:row-span-1",
  "2x1": "md:col-span-2 md:row-span-1",
  "1x2": "md:col-span-1 md:row-span-2",
  "2x2": "md:col-span-2 md:row-span-2",
};

export function BentoTile({
  size = "1x1",
  className,
  children,
  delay = 0,
  tint,
}: {
  size?: Size;
  className?: string;
  children: React.ReactNode;
  delay?: number;
  tint?: "violet" | "coral" | "amber" | "cream";
}) {
  const tintClass =
    tint === "violet"
      ? "bg-gradient-to-br from-violet-50 to-white"
      : tint === "coral"
        ? "bg-gradient-to-br from-orange-50 to-white"
        : tint === "amber"
          ? "bg-gradient-to-br from-amber-50 to-white"
          : tint === "cream"
            ? "bg-gradient-to-br from-[#FCFAF3] to-white"
            : "bg-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)]",
        tintClass,
        sizeClass[size],
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
