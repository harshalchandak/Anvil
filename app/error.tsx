"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {error.digest ? `Reference: ${error.digest}` : "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
