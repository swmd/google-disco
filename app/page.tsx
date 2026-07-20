"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useGenerationMachine } from "@/lib/useGenerationMachine";
import { EXAMPLE_PROMPTS } from "@/lib/intent/parser";
import { PromptBar } from "@/components/system/PromptBar";
import { GenerationStatus } from "@/components/system/GenerationStatus";
import { ThemeToggle } from "@/components/system/ThemeToggle";
import { Workspace } from "@/components/Workspace";
import { spring, staggerContainer, staggerItem } from "@/lib/motion/tokens";

export default function Page() {
  const reduce = useReducedMotion();
  const { state, submit, reset } = useGenerationMachine();
  const [value, setValue] = useState("");

  const active = state.scene !== null;
  const busy = state.phase === "parsing" || state.phase === "generating";

  const run = (prompt: string) => {
    setValue(prompt);
    submit(prompt);
  };

  return (
    <div className="grain-canvas flex min-h-screen flex-col">
      {/* App bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-canvas/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={() => {
            reset();
            setValue("");
          }}
          className="flex items-center gap-2 text-left"
          aria-label="GenTabs home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-ink">GenTabs</span>
            <span className="text-2xs text-ink-subtle">Generative UI</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={() => {
                reset();
                setValue("");
              }}
              className="rounded-full border bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted shadow-card transition-colors hover:text-ink"
            >
              New
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main id="workspace" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-8 pt-4 sm:px-6">
        {/* Prompt region — hero when idle, docked strip when active */}
        <motion.div
          layout
          transition={reduce ? { duration: 0.2 } : spring.layout}
          className={
            active
              ? "flex flex-col gap-3 pb-4"
              : "flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center"
          }
        >
          {!active && (
            <motion.div
              variants={reduce ? undefined : staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex max-w-2xl flex-col items-center gap-3"
            >
              <motion.h1
                variants={reduce ? undefined : staggerItem}
                className="text-3xl font-semibold tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.05]"
              >
                Describe an interface.
                <br />
                Watch it assemble itself.
              </motion.h1>
              <motion.p
                variants={reduce ? undefined : staggerItem}
                className="max-w-xl text-base text-ink-muted"
              >
                Type a prompt and a layout is composed on the fly — panels slide in, a map
                springs up, and shared elements morph between states. No LLM required; the
                intent is parsed deterministically into a layout schema.
              </motion.p>
            </motion.div>
          )}

          <div className={active ? "flex flex-col gap-2" : "w-full max-w-xl"}>
            <div className={active ? "flex items-center gap-3" : ""}>
              <div className={active ? "min-w-0 flex-1" : "w-full"}>
                <PromptBar
                  value={value}
                  onChange={setValue}
                  onSubmit={run}
                  compact={active}
                  busy={busy}
                />
              </div>
              {active && (
                <div className="hidden shrink-0 sm:block">
                  <GenerationStatus phase={state.phase} headline={state.scene!.headline} />
                </div>
              )}
            </div>

            {/* Example prompts */}
            <ExampleChips onPick={run} compact={active} activePrompt={state.scene?.prompt} />

            {/* Fallback / edge-case guidance */}
            <AnimatePresence>
              {state.fallbackMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={
                    active
                      ? "text-xs text-warning"
                      : "mx-auto max-w-md rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
                  }
                  role="status"
                >
                  {state.fallbackMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Active scene */}
        <AnimatePresence mode="popLayout">
          {active && state.scene && (
            <Workspace key="workspace" scene={state.scene} phase={state.phase} />
          )}
        </AnimatePresence>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 pt-2 text-2xs text-ink-subtle sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <span>Prompt → layout schema → animated render. Deterministic, offline-capable.</span>
          <span>Built with Next.js · Framer Motion · Tailwind</span>
        </div>
      </footer>
    </div>
  );
}

function ExampleChips({
  onPick,
  compact,
  activePrompt,
}: {
  onPick: (p: string) => void;
  compact: boolean;
  activePrompt?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.ul
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      className={
        compact
          ? "flex flex-wrap gap-1.5"
          : "flex flex-wrap justify-center gap-2 pt-1"
      }
      aria-label="Example prompts"
    >
      {EXAMPLE_PROMPTS.map((p) => {
        const isActive = p === activePrompt;
        return (
          <motion.li key={p} variants={reduce ? undefined : staggerItem}>
            <button
              type="button"
              onClick={() => onPick(p)}
              aria-pressed={isActive}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium shadow-card transition-colors " +
                (isActive
                  ? "border-accent bg-accent-soft text-accent"
                  : "bg-surface text-ink-muted hover:text-ink")
              }
            >
              {compact ? shorten(p) : p}
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function shorten(p: string): string {
  return p
    .replace(/^Show (me )?(my )?/i, "")
    .replace(/^What's the /i, "")
    .replace(/ route/i, "")
    .replace(/^Things to do in/i, "Explore");
}
