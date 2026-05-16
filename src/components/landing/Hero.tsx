"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientBlobs } from "@/components/ui/gradient-blobs";
import { AgentTimelineMockup } from "./AgentTimelineMockup";

const headlinePieces = [
  { text: "Turn one idea", display: false },
  { text: "into a", display: false },
  { text: "full", display: true },
  { text: "content engine.", display: false },
];

export function Hero() {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
      <GradientBlobs />
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-neutral-700 backdrop-blur">
            <Sparkles size={14} className="text-violet-500" />
            Multi-agent AI for X growth
          </span>

          <h1 className="mt-7 max-w-5xl text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            {headlinePieces.map((p, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.12 + i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={p.display ? "font-display italic gradient-text" : ""}
              >
                {p.text}
                {i < headlinePieces.length - 1 && " "}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-neutral-600 md:text-xl"
          >
            Netisize researches trends, learns viral patterns, writes posts
            and carousels, and ships them — all on autopilot, all in your
            voice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup">
              <GradientButton variant="primary" size="lg">
                Start a growth run
                <ArrowRight size={16} />
              </GradientButton>
            </Link>
            <GradientButton variant="ghost" size="lg" type="button">
              <Play size={14} />
              Watch demo
            </GradientButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-4 text-xs text-neutral-500"
          >
            No credit card · 5-minute setup · Cancel any time
          </motion.div>
        </motion.div>

        <AgentTimelineMockup />
      </div>
    </section>
  );
}
