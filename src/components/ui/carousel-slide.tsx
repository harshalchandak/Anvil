import { cn } from "@/lib/cn";

type Template =
  | "minimal-dark"
  | "premium-light"
  | "founder-notes"
  | "neon-tech"
  | "soft-pastel";

const palettes: Record<
  Template,
  { bg: string; fg: string; accent: string; muted: string; font: string }
> = {
  "minimal-dark": {
    bg: "bg-neutral-950",
    fg: "text-neutral-50",
    accent: "text-orange-400",
    muted: "text-neutral-500",
    font: "font-sans",
  },
  "premium-light": {
    bg: "bg-stone-50",
    fg: "text-stone-900",
    accent: "text-blue-600",
    muted: "text-stone-500",
    font: "font-sans",
  },
  "founder-notes": {
    bg: "bg-amber-50",
    fg: "text-amber-950",
    accent: "text-amber-700",
    muted: "text-amber-800",
    font: "font-display",
  },
  "neon-tech": {
    bg: "bg-[#0b1020]",
    fg: "text-slate-200",
    accent: "text-cyan-300",
    muted: "text-slate-400",
    font: "font-mono",
  },
  "soft-pastel": {
    bg: "bg-pink-50",
    fg: "text-pink-950",
    accent: "text-pink-600",
    muted: "text-pink-700",
    font: "font-sans",
  },
};

export function CarouselSlide({
  template = "premium-light",
  slideNumber,
  totalSlides,
  title,
  body,
  brandName = "Netisize",
  handle = "founder",
  size = "md",
  className,
}: {
  template?: Template;
  slideNumber: number;
  totalSlides: number;
  title: string;
  body: string;
  brandName?: string;
  handle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const p = palettes[template];
  const sizeClass =
    size === "sm"
      ? "h-40 w-32"
      : size === "lg"
        ? "aspect-[4/5] w-full max-w-md"
        : "aspect-[4/5] w-full";
  const padding =
    size === "sm"
      ? "p-3"
      : size === "lg"
        ? "p-10"
        : "p-7";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/10",
        p.bg,
        p.fg,
        p.font,
        sizeClass,
        padding,
        className,
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-semibold uppercase tracking-[0.2em]", p.accent)}>
            {brandName}
          </span>
          <span className={cn("text-[10px]", p.muted)}>
            {slideNumber} / {totalSlides}
          </span>
        </div>
        <div className="space-y-2">
          <h3
            className={cn(
              "text-balance font-medium tracking-tight",
              size === "lg" ? "text-3xl" : size === "sm" ? "text-[11px]" : "text-xl",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "leading-snug",
              size === "lg" ? "text-base" : size === "sm" ? "text-[9px]" : "text-xs",
              p.muted,
            )}
          >
            {body}
          </p>
        </div>
        <div className={cn("flex items-center justify-between text-[10px]", p.muted)}>
          <span>@{handle}</span>
          <span className={cn("inline-flex items-center gap-1", p.accent)}>
            <span className="inline-block h-1 w-4 rounded-full bg-current" />
            Netisize
          </span>
        </div>
      </div>
    </div>
  );
}
