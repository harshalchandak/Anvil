export type TemplateName =
  | "minimal-dark"
  | "premium-light"
  | "founder-notes"
  | "neon-tech"
  | "soft-pastel";

export type Palette = {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  fontFamily: string;
};

export const TEMPLATE_PALETTES: Record<TemplateName, Palette> = {
  "minimal-dark": {
    background: "#0a0a0a",
    foreground: "#fafafa",
    accent: "#fb923c",
    muted: "#a3a3a3",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  "premium-light": {
    background: "#fafaf9",
    foreground: "#1c1917",
    accent: "#1d4ed8",
    muted: "#78716c",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  "founder-notes": {
    background: "#fffbeb",
    foreground: "#451a03",
    accent: "#d97706",
    muted: "#92400e",
    fontFamily: "Georgia, ui-serif, serif",
  },
  "neon-tech": {
    background: "#0b1020",
    foreground: "#e2e8f0",
    accent: "#22d3ee",
    muted: "#94a3b8",
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
  },
  "soft-pastel": {
    background: "#fdf2f8",
    foreground: "#831843",
    accent: "#db2777",
    muted: "#9d174d",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
};

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;
