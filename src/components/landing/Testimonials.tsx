"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { MOCK_TESTIMONIALS } from "@/lib/mock";

const HUES = [260, 24, 320];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Loved by makers"
          title={
            <>
              Drafts that{" "}
              <span className="font-display italic">sound like you</span>.
            </>
          }
        />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {MOCK_TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className={`flex h-full flex-col gap-5 rounded-3xl border border-[var(--border-subtle)] bg-white p-7 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] ${
                i === 1 ? "md:translate-y-4" : ""
              }`}
            >
              <Quote size={28} className="text-violet-400" />
              <blockquote className="text-base leading-relaxed text-neutral-800">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-2">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${HUES[i]} 80% 60%), hsl(${(HUES[i]! + 60) % 360} 80% 55%))`,
                  }}
                >
                  {t.name.slice(0, 1)}
                </span>
                <div>
                  <div className="text-sm font-medium tracking-tight">{t.name}</div>
                  <div className="text-xs text-neutral-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
