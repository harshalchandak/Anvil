"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { signOut } from "@/lib/auth-actions";

function prettifySegment(seg: string) {
  if (!seg) return "";
  return seg
    .replace(/\[.*?\]/g, "")
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function Topbar({
  user,
}: {
  user: { email: string | null; displayName: string | null };
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumb = parts.length ? prettifySegment(parts[0]!) : "Dashboard";
  const initials = (user.displayName ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-white/70 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-6">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/dashboard" className="hover:text-neutral-800">
            Netisize
          </Link>
          <span>/</span>
          <span className="font-medium text-neutral-900">{crumb}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard?startRun=1">
            <GradientButton variant="gradient" size="sm">
              <Sparkles size={14} />
              Start growth run
            </GradientButton>
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          >
            <Bell size={16} />
          </button>
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-[var(--border-subtle)] hover:bg-neutral-50">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-500 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-sm sm:inline">
                {user.displayName ?? user.email ?? "You"}
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border-subtle)] bg-white p-2 shadow-[0_16px_50px_rgba(0,0,0,0.1)]">
              <div className="px-2 pb-2 pt-1">
                <div className="text-sm font-medium">
                  {user.displayName ?? "You"}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {user.email}
                </div>
              </div>
              <div className="border-t border-[var(--border-subtle)] py-1">
                <Link
                  href="/settings"
                  className="block rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-100"
                >
                  Settings
                </Link>
                <Link
                  href="/brand"
                  className="block rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-100"
                >
                  Brand profile
                </Link>
              </div>
              <form action={signOut} className="border-t border-[var(--border-subtle)] pt-1">
                <button
                  type="submit"
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
