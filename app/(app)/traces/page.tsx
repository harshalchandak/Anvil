import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Activity } from "lucide-react";
import { db } from "@/db/client";
import { growthRuns } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

export default async function TracesIndexPage() {
  const { appUser } = await requireAppUser();

  const runs = await tryDbQuery(
    () =>
      db
        .select({
          id: growthRuns.id,
          status: growthRuns.status,
          createdAt: growthRuns.createdAt,
          niche: growthRuns.niche,
        })
        .from(growthRuns)
        .where(eq(growthRuns.userId, appUser.id))
        .orderBy(desc(growthRuns.createdAt))
        .limit(30),
    [],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Traces
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Every step, every tool call.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Inputs, outputs, durations, retries. Pick a run to expand its tree.
        </p>
      </header>

      {runs.length === 0 ? (
        <EmptyState
          icon={<Activity size={20} />}
          title="No traces yet."
          description="Traces appear here once you've kicked off a growth run."
          action={
            <Link href="/dashboard">
              <GradientButton variant="gradient" size="md">
                Go to dashboard
              </GradientButton>
            </Link>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
          <ul className="divide-y divide-[var(--border-subtle)]">
            {runs.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/traces/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-elevated)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium tracking-tight">
                      {r.niche ?? "Growth run"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {r.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <PillBadge tone={statusTone(r.status)}>{r.status}</PillBadge>
                  <ArrowUpRight size={14} className="text-neutral-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
