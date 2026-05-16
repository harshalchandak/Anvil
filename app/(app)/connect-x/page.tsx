import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAppUser } from "@/lib/auth";
import { isXConfigured } from "@/lib/env";
import { redirect } from "next/navigation";
import { ConnectXDemoForm } from "./demo-form";

/**
 * Fallback when X OAuth credentials aren't configured. Lets the user
 * "connect" by typing the handle they want to test as — we then store it
 * in a signed cookie so the rest of the app behaves as if they were
 * connected. The moment real X creds are added the /api/auth/x/connect
 * route stops redirecting here and uses real OAuth instead.
 */
export default async function ConnectXPage() {
  await requireAppUser();

  // If real X creds ARE configured, the user should never end up here —
  // bounce them at the real OAuth start instead.
  if (isXConfigured()) {
    redirect("/api/auth/x/connect");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-800"
        >
          <ArrowLeft size={12} /> Back to settings
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Connect X
        </p>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Demo connect.
        </h1>
        <p className="text-sm leading-relaxed text-neutral-600">
          X OAuth credentials aren&apos;t configured yet, so we&apos;ll
          remember the handle you type below as your &quot;connected&quot;
          account. Posts won&apos;t actually ship to X — set{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
            X_CLIENT_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
            X_CLIENT_SECRET
          </code>{" "}
          in <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
          to enable real publishing.
        </p>
      </header>

      <ConnectXDemoForm />

      <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 text-sm text-violet-900">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-violet-700">
          Real connect, in 30 minutes
        </h2>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed">
          <li>
            1. Visit{" "}
            <a
              className="underline"
              href="https://developer.twitter.com/en/portal/projects-and-apps"
              target="_blank"
              rel="noreferrer"
            >
              developer.twitter.com
            </a>{" "}
            → create a Project + App.
          </li>
          <li>
            2. App settings → &quot;Set up&quot; User authentication. Type:
            Web App. OAuth 2.0: ON.
          </li>
          <li>
            3. Callback URL:{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              http://localhost:3000/api/auth/x/callback
            </code>
          </li>
          <li>
            4. Copy Client ID + Secret → paste into{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">.env.local</code>
            , restart{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">pnpm dev</code>.
          </li>
        </ol>
      </section>
    </div>
  );
}
