import {
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  TEMPLATE_PALETTES,
  type TemplateName,
} from "@/carousel/styles";

export type SlideProps = {
  template: TemplateName;
  slideNumber: number;
  totalSlides: number;
  title: string;
  body: string;
  brand: { name: string; handle: string | null };
};

/**
 * A single carousel slide. Used by the internal /_internal/render-slide page
 * and screenshotted by the Playwright renderer. Sized exactly to a 1080x1350
 * X-friendly portrait aspect ratio.
 */
export function Slide({
  template,
  slideNumber,
  totalSlides,
  title,
  body,
  brand,
}: SlideProps) {
  const palette = TEMPLATE_PALETTES[template];

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: palette.background,
        color: palette.foreground,
        fontFamily: palette.fontFamily,
        padding: "96px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.5,
            color: palette.accent,
          }}
        >
          {brand.name}
        </div>
        <div style={{ fontSize: 24, color: palette.muted }}>
          {slideNumber} / {totalSlides}
        </div>
      </header>

      <main style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        <h1
          style={{
            fontSize: 96,
            lineHeight: 1.05,
            fontWeight: 700,
            margin: 0,
            letterSpacing: -2,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 42,
            lineHeight: 1.35,
            margin: 0,
            color: palette.foreground,
            opacity: 0.85,
          }}
        >
          {body}
        </p>
      </main>

      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 24, color: palette.muted }}>
          {brand.handle ? `@${brand.handle}` : ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            color: palette.muted,
          }}
        >
          <span
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: palette.accent,
              display: "inline-block",
            }}
          />
          Netisize
        </div>
      </footer>
    </div>
  );
}
