"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, RefreshCw, Send } from "lucide-react";
import { CarouselSlide } from "@/components/ui/carousel-slide";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/cn";

type Template =
  | "minimal-dark"
  | "premium-light"
  | "founder-notes"
  | "neon-tech"
  | "soft-pastel";

const TEMPLATES: { value: Template; label: string }[] = [
  { value: "minimal-dark", label: "Minimal Dark" },
  { value: "premium-light", label: "Premium Light" },
  { value: "founder-notes", label: "Founder Notes" },
  { value: "neon-tech", label: "Neon Tech" },
  { value: "soft-pastel", label: "Soft Pastel" },
];

type Slide = { n: number; title: string; body: string };

export function CarouselEditor({
  carouselId,
  caption: initialCaption,
  initialTemplate,
  slides: initialSlides,
}: {
  carouselId: string;
  caption: string;
  initialTemplate: Template;
  slides: Slide[];
}) {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [caption, setCaption] = useState(initialCaption);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [active, setActive] = useState(0);

  void carouselId; // used by save action in the real wire-up

  const current = slides[active]!;

  function updateActive(patch: Partial<Slide>) {
    setSlides((cur) =>
      cur.map((s, i) => (i === active ? { ...s, ...patch } : s)),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[120px_1fr_320px]">
      {/* Thumbnails */}
      <aside className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
        {slides.map((s, i) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "block w-full rounded-xl p-1 ring-1 transition",
              active === i
                ? "ring-2 ring-violet-500"
                : "ring-[var(--border-subtle)] hover:ring-violet-300",
            )}
          >
            <CarouselSlide
              template={template}
              slideNumber={s.n}
              totalSlides={slides.length}
              title={s.title}
              body={s.body}
              size="sm"
            />
          </button>
        ))}
      </aside>

      {/* Big preview */}
      <section className="flex items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-8">
        <motion.div
          key={`${template}-${active}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <CarouselSlide
            template={template}
            slideNumber={current.n}
            totalSlides={slides.length}
            title={current.title}
            body={current.body}
            size="lg"
          />
        </motion.div>
      </section>

      {/* Controls */}
      <aside className="space-y-5">
        <div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
              Template
            </span>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as Template)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
              Slide title
            </span>
            <input
              value={current.title}
              onChange={(e) => updateActive({ title: e.target.value })}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
              Slide body
            </span>
            <textarea
              rows={3}
              value={current.body}
              onChange={(e) => updateActive({ body: e.target.value })}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
            Caption (the root tweet)
          </span>
          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <div className="flex flex-col gap-2">
          <GradientButton variant="gradient" size="md" className="w-full">
            <Send size={14} />
            Publish to X
          </GradientButton>
          <GradientButton variant="secondary" size="sm" className="w-full">
            <Download size={14} />
            Export all as PNG
          </GradientButton>
          <GradientButton variant="ghost" size="sm" className="w-full">
            <RefreshCw size={14} />
            Regenerate slides
          </GradientButton>
        </div>
      </aside>
    </div>
  );
}
