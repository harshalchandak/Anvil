import type { ReactNode } from "react";
import Link from "next/link";
import { GradientBlobs } from "@/components/ui/gradient-blobs";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <GradientBlobs />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-base font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-500 to-orange-500"
          />
          Netisize
        </Link>
        <div className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur">
          {children}
        </div>
      </div>
    </main>
  );
}
