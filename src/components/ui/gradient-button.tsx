"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "gradient" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClass: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800",
  // Subtle solid violet — quieter than the original violet→coral gradient,
  // still on-brand for primary CTAs.
  gradient:
    "bg-violet-600 text-white shadow-[0_4px_14px_rgba(110,86,248,0.2)] hover:bg-violet-700 hover:shadow-[0_8px_24px_rgba(110,86,248,0.25)]",
  secondary:
    "bg-white text-neutral-900 border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)]",
  ghost: "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const GradientButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, className, variant = "primary", size = "md", ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(baseClass, variantClass[variant], sizeClass[size], className)}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
GradientButton.displayName = "GradientButton";
