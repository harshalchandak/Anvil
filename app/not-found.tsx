// Static not-found — no client deps so prerender never crashes.
export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          404
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">
          Page not found.
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          The URL you tried doesn&apos;t exist. Head back to the dashboard.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Go to dashboard →
        </a>
      </div>
    </main>
  );
}
