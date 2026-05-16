import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-neutral-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
