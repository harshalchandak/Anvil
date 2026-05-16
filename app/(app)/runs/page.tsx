import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { db } from "@/db/client";
import { growthRuns } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { AgentIcon } from "@/components/ui/agent-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

export default async function RunsListPage() {
  const { appUser } = await requireAppUser();

  const runs = await tryDbQuery(
    () =>
      db
        .select()
        .from(growthRuns)
        .where(eq(growthRuns.userId, appUser.id))
        .orderBy(desc(growthRuns.createdAt))
        .limit(50),
    [],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Runs
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Every growth run, in one feed.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Inspect, replay, or branch any run you&apos;ve shipped.
        </p>
      </header>

      {runs.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={20} />}
          title="No runs yet."
          description="Connect your X account in Settings, then start your first growth run from the dashboard. Live agent activity will land here."
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
                  href={`/runs/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-elevated)]"
                >
                  <span className="flex -space-x-1.5">
                    {(["research", "pattern", "strategy", "copy"] as const).map((k) => (
                      <AgentIcon
                        key={k}
                        agentKey={k}
                        size={26}
                        className="ring-2 ring-white"
                      />
                    ))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium tracking-tight text-neutral-900">
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
