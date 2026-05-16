"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  Calendar,
  Images,
  LineChart,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brand", label: "Brand", icon: Building2 },
  { href: "/runs", label: "Runs", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/carousels", label: "Carousels", icon: Images },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/traces", label: "Traces", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
}: {
  user: { email: string | null; displayName: string | null };
}) {
  const pathname = usePathname();
  const initials = (user.displayName ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 px-4 py-5 lg:flex">
      <Link href="/" className="mb-2 flex items-center gap-2.5 px-2">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-500 to-orange-500"
        />
        <span className="text-base font-semibold tracking-tight">Netisize</span>
      </Link>

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:bg-neutral-50"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-500 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {user.displayName ?? user.email ?? "Workspace"}
            </span>
            <span className="block truncate text-[11px] text-neutral-500">
              Personal · Free
            </span>
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className="text-neutral-400"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m7 9 5-5 5 5M7 15l5 5 5-5"
          />
        </svg>
      </button>

      <nav className="mt-5 flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : "text-neutral-600 hover:bg-white hover:text-neutral-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-orange-500"
                />
              )}
              <item.icon size={16} className={active ? "text-violet-600" : ""} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-white p-3 text-xs text-neutral-600 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 text-neutral-800">
          <Sparkles size={14} className="text-violet-500" />
          <strong className="text-sm font-medium tracking-tight">
            You&apos;re on Free
          </strong>
        </div>
        <p className="mt-1 leading-relaxed">
          1 run / week. Upgrade for autopilot &amp; carousels.
        </p>
        <Link
          href="/#pricing"
          className="mt-2 inline-flex items-center gap-1 text-violet-600 hover:underline"
        >
          See Pro →
        </Link>
      </div>
    </aside>
  );
}
