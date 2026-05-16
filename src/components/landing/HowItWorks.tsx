"use client";

import { motion } from "framer-motion";
import { Settings2, Rocket, ClipboardCheck, BarChart3 } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const STEPS = [
  {
    n: "01",
    icon: Settings2,
    title: "Set your brand",
    body: "Niche, audience, tone, banned words, samples. Five minutes, done forever.",
    tint: "bg-gradient-to-br from-violet-50 to-white",
    accent: "text-violet-600",
  },
  {
    n: "02",
    icon: Rocket,
    title: "Start a growth run",
    body: "Eight agents fan out, research trends live, and compose a week of content.",
    tint: "bg-gradient-to-br from-orange-50 to-white",
    accent: "text-orange-600",
  },
  {
    n: "03",
    icon: ClipboardCheck,
    title: "Review & approve",
    body: "Inspect drafts with QC scores. Rewrite in one line. Approve what ships.",
    tint: "bg-gradient-to-br from-amber-50 to-white",
    accent: "text-amber-700",
  },
  {
    n: "04",
    icon: BarChart3,
    title: "Publish & learn",
    body: "Schedule or autopilot to X. Analytics agent learns what worked, next run is sharper.",
    tint: "bg-gradient-to-br from-emerald-50 to-white",
    accent: "text-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section id="product" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From <span className="font-display italic">empty calendar</span>{" "}
              to shipped content in minutes.
            </>
          }
          subtitle="Four steps. No prompting tricks. No copy-paste workflows."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.article
              key={s.n}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className={`group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-7 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] ${s.tint}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-mono tracking-tight ${s.accent}`}>
                  {s.n}
                </span>
                <s.icon size={20} className={s.accent} />
              </div>
              <h3 className="text-xl font-medium tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600">{s.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
