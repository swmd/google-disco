"use client";
/** Staggered "quick fact" chips rendered under the stage during a scene. */
import { motion, useReducedMotion } from "framer-motion";
import { reducedContainer, reducedStaggerItem, staggerContainer, staggerItem } from "@/lib/motion/tokens";

export function ChipRow({ chips, phase }: { chips: string[]; phase: string }) {
  const reduce = useReducedMotion();
  if (phase !== "ready") return null;
  const container = reduce ? reducedContainer : staggerContainer;
  const item = reduce ? reducedStaggerItem : staggerItem;

  return (
    <motion.ul
      key={chips.join("|")}
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
      aria-label="Quick facts"
    >
      {chips.map((c) => (
        <motion.li
          key={c}
          variants={item}
          className="rounded-full border bg-surface px-3 py-1 text-xs font-medium text-ink-muted shadow-card"
        >
          {c}
        </motion.li>
      ))}
    </motion.ul>
  );
}
