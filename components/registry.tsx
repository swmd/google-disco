"use client";
/**
 * Component / variant registry.
 *
 * Maps an intent (the `variant` on a DetailPanel descriptor) to its presentation
 * metadata. Rendering is driven by data lookups here rather than by branching
 * in the components — adding a new intent means adding a builder + one entry.
 */
import type { IntentKind } from "@/lib/intent/types";
import type { ReactNode } from "react";

export interface VariantMeta {
  label: string;
  icon: ReactNode;
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {children}
  </svg>
);

export const VARIANT_META: Record<IntentKind, VariantMeta> = {
  flight: {
    label: "Flight",
    icon: <Icon><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8l-8.2-1.8a1 1 0 0 0-.9 1.7l6.1 4-2 3.5-2.4-.4a1 1 0 0 0-.9 1.6l1.8 1.9 1.9 1.8a1 1 0 0 0 1.6-.9l-.4-2.4 3.5-2 4 6.1a1 1 0 0 0 1.7-.9Z" /></Icon>,
  },
  hotel: {
    label: "Hotel",
    icon: <Icon><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9h.01M9 12h.01M9 15h.01" /></Icon>,
  },
  weather: {
    label: "Weather",
    icon: <Icon><path d="M12 2v2M5 5l1.5 1.5M2 12h2M20 12h2M17.5 6.5 19 5M7 18a5 5 0 1 1 8-6 3.5 3.5 0 1 1-1 7H8a2 2 0 0 1-1-4Z" /></Icon>,
  },
  places: {
    label: "Nearby",
    icon: <Icon><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></Icon>,
  },
  unknown: {
    label: "Result",
    icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></Icon>,
  },
};
