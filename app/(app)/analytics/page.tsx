import Link from "next/link";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { LineChart, Sparkles } from "lucide-react";
import { db } from "@/db/client";
import { analyticsSnapshots, learningInsights } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

type AggRow = {
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  bookmarks: number;
  postCount: number;
};

export default async function AnalyticsPage() {
  const { appUser } = await requireAppUser();

  const cutoff = new Date(Date.now() - 7 * 86400 * 1000);

  const totals = await tryDbQuery<AggRow | null>(
    async () =>
      (
        await db
          .select({
            impressions: sql<number>`coalesce(sum(${analyticsSnapshots.impressions}), 0)::int`.as("impressions"),
            likes: sql<number>`coalesce(sum(${analyticsSnapshots.likes}), 0)::int`.as("likes"),
            replies: sql<number>`coalesce(sum(${analyticsSnapshots.replies}), 0)::int`.as("replies"),
            reposts: sql<number>`coalesce(sum(${analyticsSnapshots.reposts}), 0)::int`.as("reposts"),
            bookmarks: sql<number>`coalesce(sum(${analyticsSnapshots.bookmarks}), 0)::int`.as("bookmarks"),
            postCount: sql<number>`count(distinct ${analyticsSnapshots.generatedPostId})::int`.as("post_count"),
          })
          .from(analyticsSnapshots)
          .where(
            and(
              eq(analyticsSnapshots.userId, appUser.id),
              isNotNull(analyticsSnapshots.fetchedAt),
              gte(analyticsSnapshots.fetchedAt, cutoff),
            ),
          )
      )[0] ?? null,
    null,
  );

  const insights = await tryDbQuery(
    () =>
      db
        .select()
        .from(learningInsights)
        .where(
          and(
            eq(learningInsights.userId, appUser.id),
            gte(learningInsights.createdAt, cutoff),
          ),
        )
        .limit(10),
    [],
  );

  const hasData = totals && totals.postCount > 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          How your content is{" "}
          <span className="font-display italic text-neutral-500">
            actually performing
          </span>
          .
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Pulled from X every 6 hours. The Analytics agent turns numbers into next moves.
        </p>
      </header>

      {!hasData ? (
        <EmptyState
          icon={<LineChart size={20} />}
          title="No metrics yet."
          description="Analytics populate after your first published post is live on X for ~6 hours. Ship something, come back later."
          action={
            <Link href="/dashboard">
              <GradientButton variant="gradient" size="md">
                Go to dashboard
              </GradientButton>
            </Link>
          }
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Kpi label="Impressions" value={fmt(totals!.impressions)} />
            <Kpi label="Likes" value={fmt(totals!.likes)} />
            <Kpi label="Replies" value={fmt(totals!.replies)} />
            <Kpi label="Reposts" value={fmt(totals!.reposts)} />
            <Kpi label="Bookmarks" value={fmt(totals!.bookmarks)} />
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium tracking-tight">
              <Sparkles size={14} className="-mt-0.5 mr-1 inline text-violet-500" />
              Insights from your analytics agent
            </h2>
            {insights.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/40 p-6 text-sm text-neutral-500">
                Insights show up after the first metrics rollup completes.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {insights.map((ins) => (
                  <article
                    key={ins.id}
                    className="rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.15em] text-violet-600">
                      {ins.insightType}
                      {ins.confidence != null &&
                        ` · ${(ins.confidence * 100).toFixed(0)}%`}
                    </div>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-neutral-700">
                      {JSON.stringify(ins.content, null, 2)}
                    </pre>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1.5 text-xl font-medium tabular-nums tracking-tight">
        {value}
      </div>
    </div>
  );
}
