/**
 * Motion tokens
 * -------------
 * Centralized spring/easing profiles so every interaction speaks the same
 * physical language. Components import these instead of hand-tuning numbers,
 * which keeps hover/focus/active/layout transitions consistent across the app.
 */
import type { Transition, Variants } from "framer-motion";

export const spring = {
  /** Snappy, for hover/press micro-interactions. */
  press: { type: "spring", stiffness: 520, damping: 30, mass: 0.7 } as Transition,
  /** The signature layout/morph transition — smooth, weighty, no overshoot fuss. */
  layout: { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } as Transition,
  /** Gentle entrance for panels sliding in. */
  entrance: { type: "spring", stiffness: 260, damping: 32, mass: 1 } as Transition,
  /** Camera / stage movement — slower and cinematic. */
  camera: { type: "spring", stiffness: 120, damping: 26, mass: 1.1 } as Transition,
};

export const easing = {
  emphasized: [0.2, 0, 0, 1] as [number, number, number, number],
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/** Stagger container: children animate in sequence to signal generation. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: spring.entrance,
  },
};

/** Fade-through used when content swaps inside a persistent container (morph). */
export const fadeThrough: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easing.standard } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: easing.standard } },
};

/**
 * Reduced-motion variants: swap position/scale for a plain opacity fade.
 * Callers pick these when `useReducedMotion()` is true.
 */
export const reducedStaggerItem: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const reducedContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.02 } },
};
