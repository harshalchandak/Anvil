"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/cn";

export function Navbar({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-[var(--border-subtle)] bg-white/70 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-500 to-orange-500"
          />
          <span className="text-base font-semibold tracking-tight">Netisize</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink href="#product">Product</NavLink>
          <NavLink href="#agents">Agents</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/dashboard">
              <GradientButton size="sm" variant="primary">
                Dashboard
              </GradientButton>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm text-neutral-700 transition hover:text-neutral-900 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link href="/signup">
                <GradientButton size="sm" variant="primary">
                  Start free
                </GradientButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <motion.a
      href={href}
      className="text-sm text-neutral-700 transition hover:text-neutral-900"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.a>
  );
}
