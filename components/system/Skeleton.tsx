"use client";
/** Shimmer skeleton primitives used to signal runtime generation. */
import { clsx } from "@/lib/clsx";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "skeleton-shimmer relative overflow-hidden rounded bg-[rgb(var(--ink)/0.08)]",
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "skeleton-shimmer relative overflow-hidden rounded-lg bg-[rgb(var(--ink)/0.06)]",
        className
      )}
      aria-hidden
    />
  );
}
