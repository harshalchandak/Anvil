import { eq } from "drizzle-orm";
import { Copy, RefreshCw, Webhook } from "lucide-react";
import { db } from "@/db/client";
import { xAccounts } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { getDemoXAccount } from "@/lib/demo-x-account";
import { disconnectX } from "./actions";
import { GradientButton } from "@/components/ui/gradient-button";
import { PillBadge } from "@/components/ui/pill-badge";

type SearchParams = Promise<{ x_connected?: string; x_error?: string }>;

type DisplayXAccount =
  | {
      kind: "db";
      xUsername: string;
      expiresAt: Date;
      invalid: boolean;
      lastRefreshError: string | null;
    }
  | {
      kind: "cookie";
      xUsername: string;
      connectedAt: Date;
    };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { appUser } = await requireAppUser();
  const { x_connected, x_error } = await searchParams;

  const xAccountDb = await tryDbQuery<typeof xAccounts.$inferSelect | null>(
    async () =>
      (
        await db
          .select()
          .from(xAccounts)
          .where(eq(xAccounts.userId, appUser.id))
          .limit(1)
      )[0] ?? null,
    null,
  );

  let xAccount: DisplayXAccount | null = null;
  if (xAccountDb) {
    xAccount = {
      kind: "db",
      xUsername: xAccountDb.xUsername,
      expiresAt: xAccountDb.expiresAt,
      invalid: xAccountDb.invalid,
      lastRefreshError: xAccountDb.lastRefreshError,
    };
  } else {
    const demo = await getDemoXAccount();
    if (demo) {
      xAccount = {
        kind: "cookie",
        xUsername: demo.xUsername,
        connectedAt: new Date(demo.connectedAtIso),
      };
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          The control room.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Connect your X account, manage publishing mode, tune content rules.
        </p>
      </header>

      {x_connected && (
        <FlashBanner tone="ok">X account connected. Your team can publish on your behalf now.</FlashBanner>
      )}
      {x_error && (
        <FlashBanner tone="error">
          X connection failed: {decodeURIComponent(x_error)}
        </FlashBanner>
      )}

      <Card>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium tracking-tight">X account</h2>
              {xAccount?.kind === "db" && xAccount.invalid ? (
                <PillBadge tone="danger">Reconnect needed</PillBadge>
              ) : xAccount ? (
                <PillBadge tone="success">Connected</PillBadge>
              ) : (
                <PillBadge tone="neutral">Not connected</PillBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              Netisize posts to your real X timeline using your own OAuth tokens.
              Tokens are AES-256-GCM encrypted at rest.
            </p>
            {xAccount ? (
              <div className="mt-4 space-y-1 text-sm">
                <div className="text-neutral-700">
                  Connected as{" "}
                  <span className="font-medium text-neutral-900">
                    @{xAccount.xUsername}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {xAccount.kind === "db" ? (
                    <>
                      Token expires{" "}
                      {xAccount.expiresAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </>
                  ) : (
                    <>
                      Connected{" "}
                      {xAccount.connectedAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </>
                  )}
                </div>
                {xAccount.kind === "db" && xAccount.invalid && (
                  <div className="text-xs text-red-700">
                    Refresh failed — reconnect required.
                    {xAccount.lastRefreshError
                      ? ` (${xAccount.lastRefreshError})`
                      : ""}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                You can still draft, design, schedule, and export — connect
                later when you&apos;re ready to ship.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <a href="/api/auth/x/connect">
              <GradientButton variant="primary" size="md">
                <RefreshCw size={14} />
                {xAccount ? "Reconnect X" : "Connect X"}
              </GradientButton>
            </a>
            {xAccount && (
              <form action={disconnectX}>
                <GradientButton type="submit" variant="secondary" size="sm" className="w-full">
                  Disconnect
                </GradientButton>
              </form>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium tracking-tight">
              Webhook trigger
            </h2>
            <PillBadge tone="info">HMAC-SHA256</PillBadge>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            POST to this URL to start a growth run from Make, Zapier, n8n, or
            your own cron. Sign the body with your secret in the{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
              x-netisize-signature
            </code>{" "}
            header.
          </p>
          <div className="mt-4 space-y-3">
            <CopyField
              label="Endpoint"
              value={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhooks/content-trigger`}
            />
            <CopyField label="Signing secret" value="••••••••••••••••" masked />
          </div>
        </div>
      </Card>

    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      {children}
    </section>
  );
}

function FlashBanner({
  tone,
  children,
}: {
  tone: "ok" | "error";
  children: React.ReactNode;
}) {
  const palette =
    tone === "ok"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : "border-red-100 bg-red-50 text-red-700";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${palette}`}>
      {children}
    </div>
  );
}

function CopyField({
  label,
  value,
  masked,
}: {
  label: string;
  value: string;
  masked?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2">
        <Webhook size={14} className="text-neutral-400" />
        <code className="flex-1 truncate text-xs text-neutral-700">{value}</code>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:bg-white hover:text-neutral-800"
        >
          <Copy size={12} />
          Copy
        </button>
        {masked && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:bg-white hover:text-neutral-800"
          >
            <RefreshCw size={12} /> Rotate
          </button>
        )}
      </div>
    </div>
  );
}
