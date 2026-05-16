import Link from "next/link";

const COLS = [
  {
    title: "Product",
    links: ["Overview", "Agents", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Resources",
    links: ["Docs", "Playbooks", "Help center", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookie policy", "Acceptable use"],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 pt-16 pb-10">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 md:grid-cols-6">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-500 to-orange-500"
            />
            <span className="text-base font-semibold tracking-tight">
              Netisize
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600">
            Your autonomous AI content team. Research, write, design, ship — all
            in your voice.
          </p>
          <p className="mt-6 text-xs text-neutral-500">
            © {new Date().getFullYear()} Netisize. All rights reserved.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title} className="text-sm">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
              {c.title}
            </div>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-neutral-700 transition hover:text-neutral-900"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
