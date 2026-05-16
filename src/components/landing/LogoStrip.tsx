"use client";

import { motion } from "framer-motion";
import { MOCK_LOGOS } from "@/lib/mock";

export function LogoStrip() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-neutral-500">
          Trusted by creators &amp; teams shipping content
        </p>
        <div className="mt-6 grid grid-cols-3 items-center gap-x-6 gap-y-4 sm:grid-cols-6">
          {MOCK_LOGOS.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="text-center font-display text-lg tracking-tight text-neutral-500 hover:text-neutral-800"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
