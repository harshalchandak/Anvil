"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/cn";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Kick the tires. No credit card.",
    features: [
      "1 growth run / week",
      "Manual review only",
      "All 8 agents",
      "Up to 5 posts per run",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$24",
    cadence: "/ month",
    blurb: "For creators who post seriously.",
    features: [
      "Unlimited growth runs",
      "Autopilot publishing",
      "Carousel renderer (PNG export)",
      "Webhook triggers",
      "Analytics learning loop",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$79",
    cadence: "/ month",
    blurb: "For small content teams.",
    features: [
      "Everything in Pro",
      "5 seats, shared brand profile",
      "Approval workflow",
      "Audit log + export",
      "SSO available",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Honest pricing.{" "}
              <span className="font-display italic">No surprise tokens.</span>
            </>
          }
          subtitle="Flat monthly. All agents included. Cancel any time."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className={cn(
                "relative flex h-full flex-col gap-6 rounded-3xl border bg-white p-7 shadow-[0_4px_18px_rgba(0,0,0,0.04)]",
                p.highlighted
                  ? "border-transparent gradient-border"
                  : "border-[var(--border-subtle)]",
              )}
            >
              {p.highlighted && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                  <Sparkles size={11} />
                  Recommended
                </span>
              )}
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-500">
                  {p.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-sm text-neutral-500">{p.cadence}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{p.blurb}</p>
              </div>
              <ul className="space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-neutral-700">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <Link href="/signup" className="block">
                  <GradientButton
                    className="w-full"
                    size="md"
                    variant={p.highlighted ? "gradient" : "secondary"}
                  >
                    {p.cta}
                  </GradientButton>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
