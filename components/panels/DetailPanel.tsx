"use client";
/**
 * DetailPanel — the "sidebar that becomes a hotel card".
 *
 * Continuity strategy (the Morph):
 *  - This component is mounted ONCE and never keyed by scene, so React keeps the
 *    same DOM node across prompts. `layout` then FLIP-animates its size/position
 *    as content changes shape (flight stats -> hotel card).
 *  - Inner CONTENT is keyed by variant+phase and cross-fades via AnimatePresence
 *    (`fadeThrough`) so text swaps without the container flashing.
 *  - During `generating` the same container shows skeletons, so the reveal reads
 *    as the panel "filling in" rather than popping in.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DetailPanel as DetailPanelData } from "@/lib/intent/types";
import type { GenPhase } from "@/lib/useGenerationMachine";
import { VARIANT_META } from "@/components/registry";
import {
  fadeThrough,
  reducedContainer,
  reducedStaggerItem,
  spring,
  staggerContainer,
  staggerItem,
} from "@/lib/motion/tokens";
import { SkeletonLine } from "@/components/system/Skeleton";

export function DetailPanel({ panel, phase }: { panel: DetailPanelData; phase: GenPhase }) {
  const reduce = useReducedMotion();
  const meta = VARIANT_META[panel.variant];
  const generating = phase === "generating" || phase === "parsing";

  const container = reduce ? reducedContainer : staggerContainer;
  const item = reduce ? reducedStaggerItem : staggerItem;

  return (
    <motion.section
      layout
      layoutId="detail-panel"
      transition={reduce ? { duration: 0.2 } : spring.layout}
      aria-label={`${meta.label} details`}
      className="flex w-full flex-col gap-4 rounded-2xl border bg-surface p-5 shadow-card"
    >
      {/* Header morphs in place (icon + eyebrow persist across variants) */}
      <motion.header layout className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent"
          >
            {meta.icon}
          </span>
          <motion.span layout className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
            {panel.eyebrow}
          </motion.span>
        </div>
        {panel.accentTag && (
          <motion.span
            layout
            className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent"
          >
            {panel.accentTag}
          </motion.span>
        )}
      </motion.header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${panel.variant}-${generating ? "skeleton" : "content"}`}
          variants={fadeThrough}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col gap-4"
        >
          {generating ? (
            <SkeletonState />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              <motion.div variants={item} className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold leading-tight text-ink">{panel.title}</h2>
                {panel.subtitle && <p className="text-sm text-ink-muted">{panel.subtitle}</p>}
              </motion.div>

              <motion.dl variants={container} className="grid grid-cols-2 gap-x-4 gap-y-3">
                {panel.fields.map((f) => (
                  <motion.div key={f.label} variants={item} className="flex flex-col gap-0.5">
                    <dt className="text-2xs uppercase tracking-wide text-ink-subtle">{f.label}</dt>
                    <dd className={f.emphasis ? "text-lg font-semibold text-ink" : "text-sm text-ink"}>
                      {f.value}
                    </dd>
                  </motion.div>
                ))}
              </motion.dl>

              {panel.timeline && (
                <motion.ol variants={container} className="mt-1 flex flex-col gap-0 border-t pt-3">
                  {panel.timeline.map((t, i) => (
                    <motion.li
                      key={t.label}
                      variants={item}
                      className="relative flex items-center justify-between py-1.5 pl-5 text-sm"
                    >
                      {/* Connector runs dot-edge to next dot-centre, so it never
                          passes under the dot it belongs to. */}
                      {i < panel.timeline!.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[3.5px] top-[calc(50%+4px)] h-[calc(100%-4px)] w-px bg-border"
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-accent"
                      />
                      <span className="text-ink-muted">{t.label}</span>
                      <span className="font-medium text-ink">{t.value}</span>
                    </motion.li>
                  ))}
                </motion.ol>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

function SkeletonState() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex flex-col gap-2">
        <SkeletonLine className="h-5 w-3/4" />
        <SkeletonLine className="h-3.5 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <SkeletonLine className="h-2.5 w-12" />
            <SkeletonLine className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t pt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
