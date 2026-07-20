"use client";
/**
 * Small status line that narrates the fake generation lifecycle. Doubles as an
 * ARIA live region so screen-reader users are told what is being built.
 */
import { AnimatePresence, motion } from "framer-motion";
import type { GenPhase } from "@/lib/useGenerationMachine";

const LABEL: Record<GenPhase, string> = {
  idle: "",
  parsing: "Understanding your prompt…",
  generating: "Composing layout…",
  ready: "",
};

export function GenerationStatus({ phase, headline }: { phase: GenPhase; headline: string }) {
  const text = phase === "ready" ? headline : LABEL[phase];
  const active = phase === "parsing" || phase === "generating";

  return (
    <div className="flex h-5 items-center gap-2" aria-live="polite" aria-atomic>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-xs font-medium text-ink-muted"
          >
            {active && (
              <span aria-hidden className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1 w-1 rounded-full bg-accent"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            )}
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
