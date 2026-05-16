"use client";

import {
  Activity,
  Images,
  Calendar,
  Webhook,
  TrendingUp,
  Download,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { BentoTile } from "@/components/ui/bento-tile";
import { PillBadge } from "@/components/ui/pill-badge";
import { CarouselSlide } from "@/components/ui/carousel-slide";
import { AgentIcon } from "@/components/ui/agent-icon";
import { AGENT_ORDER } from "@/lib/mock";

export function BentoGrid() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Built for the part of content{" "}
              <span className="font-display italic">that isn&apos;t writing</span>.
            </>
          }
          subtitle="Research, distribution, observability, and learning — handled for you."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 md:auto-rows-[200px] md:grid-cols-3">
          {/* Big tile: live agent timeline */}
          <BentoTile size="2x2" tint="violet" className="md:col-span-2 md:row-span-2">
            <header className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-violet-600">
                <Activity size={14} />
                Live agent timeline
              </span>
              <PillBadge tone="violet">Realtime</PillBadge>
            </header>
            <h3 className="mt-3 text-2xl font-medium tracking-tight">
              Watch the team think.
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Each agent reports its inputs, outputs, and timing — so you know
              exactly why a post was written the way it was.
            </p>
            <div className="mt-5 space-y-1.5">
              {AGENT_ORDER.slice(0, 5).map((k, i) => {
                // Static durations — keeps SSR/CSR hydration consistent.
                const fakeDurations = [3.4, 5.8, 4.2, 7.1, 4.9] as const;
                return (
                  <div
                    key={k}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  >
                    <AgentIcon agentKey={k} size={28} />
                    <span className="flex-1 text-xs text-neutral-700">
                      {`step ${i + 1} · completed in ${fakeDurations[i]?.toFixed(1)}s`}
                    </span>
                    <PillBadge tone="success">done</PillBadge>
                  </div>
                );
              })}
            </div>
          </BentoTile>

          {/* Carousel studio */}
          <BentoTile tint="coral" className="md:col-span-1 md:row-span-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-orange-600">
              <Images size={14} />
              Carousel Studio
            </span>
            <h3 className="mt-3 text-xl font-medium tracking-tight">
              Slide decks, designed.
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Five templates, 8 slides each, exported as PNG.
            </p>
            <div className="relative mt-5 h-56">
              <div className="absolute left-0 top-2 -rotate-6">
                <CarouselSlide
                  size="sm"
                  template="minimal-dark"
                  slideNumber={1}
                  totalSlides={8}
                  title="Month 4 is the wall."
                  body="80% of indie SaaS quits here."
                />
              </div>
              <div className="absolute left-10 top-6 rotate-2">
                <CarouselSlide
                  size="sm"
                  template="premium-light"
                  slideNumber={2}
                  totalSlides={8}
                  title="Why it hits."
                  body="Honeymoon ends. Doubt arrives."
                />
              </div>
              <div className="absolute left-20 top-10 rotate-6">
                <CarouselSlide
                  size="sm"
                  template="founder-notes"
                  slideNumber={3}
                  totalSlides={8}
                  title="The fix."
                  body="Anchor on 1 metric. Ship Fridays."
                />
              </div>
            </div>
          </BentoTile>

          {/* Calendar */}
          <BentoTile tint="amber" className="md:col-span-1 md:row-span-1">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
              <Calendar size={14} />
              Content Calendar
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight">
              A week at a glance.
            </h3>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div
                  key={i}
                  className={`flex h-8 items-center justify-center rounded-md text-[10px] ${
                    [1, 2, 4].includes(i)
                      ? "bg-amber-200/70 text-amber-900"
                      : "bg-white text-neutral-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
          </BentoTile>

          {/* Webhooks */}
          <BentoTile tint="cream" className="md:col-span-1 md:row-span-1">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-neutral-700">
              <Webhook size={14} />
              Webhook triggers
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight">
              Fire runs from anywhere.
            </h3>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-900 px-3 py-2 text-[11px] leading-relaxed text-neutral-200">
{`POST /api/webhooks/content-trigger
x-netisize-signature: <hmac>
{ "brandProfileId": "..." }`}
            </pre>
          </BentoTile>

          {/* Analytics */}
          <BentoTile tint="violet" className="md:col-span-1 md:row-span-1">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-violet-600">
              <TrendingUp size={14} />
              Learning loop
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight">
              Smarter every run.
            </h3>
            <div className="mt-3 flex h-12 items-end gap-1.5">
              {[14, 19, 22, 28, 36, 31, 31].map((v, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-violet-400 to-violet-200"
                  style={{ height: `${(v / 36) * 100}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              <strong>+38%</strong> engagement after 4 runs.
            </p>
          </BentoTile>

          {/* Export */}
          <BentoTile tint="coral" className="md:col-span-1 md:row-span-1">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-orange-600">
              <Download size={14} />
              One-click export
            </span>
            <h3 className="mt-2 text-lg font-medium tracking-tight">
              Mirror it anywhere.
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Every post + carousel exports as text and PNG for LinkedIn,
              Threads, Bluesky.
            </p>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}
