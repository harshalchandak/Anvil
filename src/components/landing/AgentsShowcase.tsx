"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { AgentCard } from "@/components/ui/agent-card";
import { AGENT_ORDER } from "@/lib/mock";

export function AgentsShowcase() {
  return (
    <section id="agents" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Your AI content team"
          title={
            <>
              Eight specialists,{" "}
              <span className="font-display italic">one workflow</span>.
            </>
          }
          subtitle="Each agent has a narrow job. They hand off, they argue, they revise — exactly like a small in-house team."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENT_ORDER.map((key, i) => (
            <AgentCard key={key} agentKey={key} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </section>
  );
}
