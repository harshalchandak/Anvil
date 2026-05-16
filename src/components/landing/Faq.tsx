"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { MOCK_FAQ } from "@/lib/mock";

export function Faq() {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="The questions everyone asks."
        />
        <Accordion.Root
          type="single"
          collapsible
          defaultValue="0"
          className="mt-12 divide-y divide-[var(--border-subtle)] overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white"
        >
          {MOCK_FAQ.map((item, i) => (
            <Accordion.Item key={i} value={String(i)}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium tracking-tight transition hover:bg-[var(--surface-elevated)]">
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-neutral-400 transition-transform group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden text-sm leading-relaxed text-neutral-600 data-[state=closed]:animate-[fadeOut_0.2s_ease] data-[state=open]:animate-[fadeIn_0.2s_ease]">
                <div className="px-6 pb-5 pt-1">{item.a}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
