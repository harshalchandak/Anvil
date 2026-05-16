import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/db/client";
import { brandProfiles, growthRuns, xAccounts } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { getDemoXAccount } from "@/lib/demo-x-account";
import { getDemoBrand } from "@/lib/demo-brand";
import { AGENT_ORDER } from "@/lib/mock";
import { StartRunButton } from "./start-run-button";
import { PillBadge, statusTone } from "@/components/ui/pill-badge";
import { AgentIcon } from "@/components/ui/agent-icon";
import { EmptyState } from "@/components/ui/empty-state";

type DashRun = {
  id: string;
  status: string;
  createdAt: Date;
  triggerType: string;
  niche: string | null;
};

type SearchParams = Promise<{ x_connected?: string; x_username?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { appUser } = await requireAppUser();
  const { x_connected, x_username } = await searchParams;

  const brandDb = await tryDbQuery<{ id: string } | null>(
    async () =>
      (
        await db
          .select({ id: brandProfiles.id })
          .from(brandProfiles)
          .where(eq(brandProfiles.userId, appUser.id))
          .limit(1)
      )[0] ?? null,
    null,
  );
  // Demo-mode fallback: pull from the signed cookie set by saveBrandProfile.
  const brandCookie = brandDb ? null : await getDemoBrand();
  const brand =
    brandDb ?? (brandCookie ? { id: brandCookie.id } : null);

  const xAccountDb = await tryDbQuery<{ id: string; xUsername: string } | null>(
    async () =>
      (
        await db
          .select({ id: xAccounts.id, xUsername: xAccounts.xUsername })
          .from(xAccounts)
          .where(eq(xAccounts.userId, appUser.id))
          .limit(1)
      )[0] ?? null,
    null,
  );

  // Demo-mode fallback: a signed cookie set by the OAuth callback. Survives
  // server restarts and refreshes — the connection feels "remembered" until
  // the user explicitly disconnects.
  const xCookie = xAccountDb ? null : await getDemoXAccount();
  const xAccount =
    xAccountDb ??
    (xCookie ? { id: "cookie", xUsername: xCookie.xUsername } : null);

  const runs: DashRun[] = await tryDbQuery<DashRun[]>(
    () =>
      db
        .select({
          id: growthRuns.id,
          status: growthRuns.status,
          createdAt: growthRuns.createdAt,
          triggerType: growthRuns.triggerType,
          niche: growthRuns.niche,
        })
        .from(growthRuns)
        .where(eq(growthRuns.userId, appUser.id))
        .orderBy(desc(growthRuns.createdAt))
        .limit(10),
    [],
  );

  // Only real runs. No fake examples — the user sees what they've actually shipped.
  const displayRuns: DashRun[] = runs;

  const greetingName =
    appUser.displayName?.split(" ")[0] ?? appUser.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Greeting + gradient hero card */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Hey {greetingName}.{" "}
          <span className="font-display italic text-neutral-500">
            Let&apos;s make something the algorithm loves.
          </span>
        </h1>
      </div>

      {x_connected && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
          <div>
            <strong className="font-medium">X account connected.</strong>{" "}
            {x_username
              ? `You're posting as @${x_username}. `
              : ""}
            Your AI team can ship to your timeline now.
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-violet-50 via-orange-50 to-amber-50 p-8 md:p-10 shadow-card">
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-orange-300/40 blur-3xl"
        />
        <div className="relative z-10 grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 backdrop-blur">
              <Sparkles size={12} />
              Your AI team is ready
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight md:text-3xl">
              Start a growth run.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-700">
              Eight agents research live trends, write 5 posts and a carousel,
              and tee them up for your review — usually under two minutes.
            </p>
          </div>
          <StartRunButton brandProfileId={brand?.id ?? null} disabled={!brand} />
        </div>
        {/* Mini agent stack */}
        <div className="relative z-10 mt-6 flex items-center gap-3 text-xs text-neutral-600">
          <span className="-space-x-2 flex">
            {AGENT_ORDER.map((k, i) => (
              <span
                key={k}
                className="inline-block ring-2 ring-white rounded-full"
                style={{ zIndex: AGENT_ORDER.length - i }}
              >
                <AgentIcon agentKey={k} size={28} />
              </span>
            ))}
          </span>
          <span>Research, Pattern, Strategy, Copywriting, Voice, Carousel, Quality, Analytics.</span>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          icon={<Layers size={16} className="text-violet-500" />}
          label="Brand profile"
          value={brand ? "Configured" : "Not set yet"}
          link="/brand"
          hint={brand ? "Edit voice & guardrails" : "5-minute setup"}
        />
        <Stat
          icon={<Activity size={16} className="text-orange-500" />}
          label="X account"
          value={xAccount ? `@${xAccount.xUsername}` : "Not connected"}
          link="/settings"
          hint={xAccount ? "Token refresh in 47 days" : "Connect to enable publishing"}
        />
        <Stat
          icon={<Calendar size={16} className="text-amber-500" />}
          label="Recent runs"
          value={String(displayRuns.length)}
          link="#recent-runs"
          hint={`${displayRuns.filter((r) => r.status === "completed").length} completed`}
        />
      </section>

      {/* Recent runs */}
      <section id="recent-runs" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-medium tracking-tight">Recent growth runs</h2>
          <Link
            href="/runs"
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {displayRuns.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title="No runs yet."
            description="Set up your brand profile, then hit Start growth run above. Your first batch lands in under 2 minutes."
            action={
              <Link
                href="/brand"
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white"
              >
                Set up brand →
              </Link>
            }
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            {displayRuns.map((r, i) => (
              <li
                key={r.id}
                className={`flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-elevated)] ${
                  i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                }`}
              >
                <span className="flex -space-x-1.5">
                  {AGENT_ORDER.slice(0, 4).map((k) => (
                    <AgentIcon
                      key={k}
                      agentKey={k}
                      size={26}
                      className="ring-2 ring-white"
                    />
                  ))}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/runs/${r.id}`}
                    className="block text-sm font-medium tracking-tight text-neutral-900 hover:underline"
                  >
                    {r.niche ?? "Growth run"}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {r.triggerType} ·{" "}
                    {r.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <PillBadge tone={statusTone(r.status)}>{r.status}</PillBadge>
                <ArrowUpRight size={14} className="text-neutral-400" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  link,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link: string;
  hint?: string;
}) {
  return (
    <Link
      href={link}
      className="group flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {icon}
        {label}
      </div>
      <div className="text-xl font-medium tracking-tight">{value}</div>
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
    </Link>
  );
}
