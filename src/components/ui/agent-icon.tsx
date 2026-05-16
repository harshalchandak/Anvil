"use client";

import {
  Compass,
  Sparkles,
  Layers,
  PenLine,
  AudioLines,
  Images,
  ShieldCheck,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENTS, type AgentKey } from "@/lib/mock";

const ICONS: Record<AgentKey, LucideIcon> = {
  research: Compass,
  pattern: Sparkles,
  strategy: Layers,
  copy: PenLine,
  voice: AudioLines,
  carousel: Images,
  quality: ShieldCheck,
  analytics: LineChart,
};

export function AgentIcon({
  agentKey,
  size = 40,
  className,
}: {
  agentKey: AgentKey;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[agentKey];
  const tone = AGENTS[agentKey].color;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] bg-gradient-to-br",
        tone,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={2.25} />
    </span>
  );
}
