"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-lg leading-relaxed text-neutral-600",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
