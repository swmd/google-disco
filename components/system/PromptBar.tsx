"use client";
/**
 * PromptBar — the single, persistent input.
 *
 * It is mounted exactly once. When the app moves from the idle hero to an active
 * scene, the surrounding layout switches from centered to docked; because this
 * element keeps its identity, `layout` FLIP-animates it into the top of the
 * workspace (the "search contracts and repositions to the top" behavior).
 */
import { motion, useReducedMotion } from "framer-motion";
import { FormEvent, useRef } from "react";
import { spring } from "@/lib/motion/tokens";
import { clsx } from "@/lib/clsx";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  compact: boolean;
  busy: boolean;
}

export function PromptBar({ value, onChange, onSubmit, compact, busy }: Props) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value);
  };

  return (
    <motion.form
      layout
      transition={reduce ? { duration: 0.2 } : spring.layout}
      onSubmit={handleSubmit}
      role="search"
      className={clsx(
        "relative z-20 flex items-center gap-2 rounded-full border bg-surface shadow-card",
        compact ? "w-full px-2 py-1.5" : "w-full px-3 py-2"
      )}
    >
      <span aria-hidden className="pl-1.5 text-ink-subtle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={compact ? "h-4 w-4" : "h-5 w-5"}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
      </span>

      <label htmlFor="prompt-input" className="sr-only">
        Describe the interface to generate
      </label>
      <input
        id="prompt-input"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe a layout…  e.g. flight from New York to London"
        autoComplete="off"
        className={clsx(
          "min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-subtle focus:outline-none",
          compact ? "text-sm" : "text-base py-1"
        )}
      />

      <motion.button
        type="submit"
        disabled={!value.trim() || busy}
        whileHover={reduce ? undefined : { scale: 1.04 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        transition={spring.press}
        className={clsx(
          "flex items-center gap-1.5 rounded-full bg-accent font-medium text-accent-ink transition-opacity disabled:opacity-40",
          compact ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm"
        )}
      >
        {busy ? (
          <motion.span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full border-2 border-accent-ink border-t-transparent"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
          />
        ) : (
          <span aria-hidden>↵</span>
        )}
        <span>{busy ? "Generating" : "Generate"}</span>
      </motion.button>
    </motion.form>
  );
}
