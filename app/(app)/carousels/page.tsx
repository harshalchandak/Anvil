import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Images } from "lucide-react";
import { db } from "@/db/client";
import { carousels } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { PillBadge } from "@/components/ui/pill-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

export default async function CarouselsListPage() {
  const { appUser } = await requireAppUser();

  const rows = await tryDbQuery(
    () =>
      db
        .select({
          id: carousels.id,
          template: carousels.template,
          status: carousels.status,
          caption: carousels.caption,
          createdAt: carousels.createdAt,
        })
        .from(carousels)
        .where(eq(carousels.userId, appUser.id))
        .orderBy(desc(carousels.createdAt))
        .limit(30),
    [],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Carousels
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Slide decks, on demand.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          The Carousel agent outlines 8 slides per deck. Pick a template, tweak
          the copy, export as PNG.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Images size={20} />}
          title="No carousels yet."
          description="Start a growth run that includes a carousel format. Outlines, slides, and PNG exports will land here."
          action={
            <Link href="/dashboard">
              <GradientButton variant="gradient" size="md">
                Go to dashboard
              </GradientButton>
            </Link>
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/carousels/${c.id}`}
              className="group flex flex-col gap-3 rounded-3xl border border-[var(--border-subtle)] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="text-sm font-medium tracking-tight">
                {prettyTemplate(c.template)}
              </div>
              <div className="text-xs text-neutral-500">
                {c.createdAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              {c.caption && (
                <p className="line-clamp-3 text-sm text-neutral-600">
                  {c.caption}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <PillBadge tone="neutral">{c.status}</PillBadge>
                <span className="inline-flex items-center gap-1 text-xs text-violet-700">
                  Open editor <ArrowUpRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function prettyTemplate(t: string) {
  return t
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
