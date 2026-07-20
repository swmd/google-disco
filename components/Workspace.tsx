"use client";
/**
 * Workspace — arranges the persistent stage + detail panel for an active scene.
 *
 * Responsive strategy:
 *  - >= lg : two columns (fluid map | fixed-width detail rail).
 *  - < lg  : stacked (map on top, detail below), using fluid CSS grid so the
 *            same panels reflow rather than being re-created.
 *
 * `layout` on the grid + panels means viewport changes and content changes
 * both animate through the same FLIP system.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Scene } from "@/lib/intent/types";
import type { GenPhase } from "@/lib/useGenerationMachine";
import { MapStage } from "@/components/panels/MapStage";
import { DetailPanel } from "@/components/panels/DetailPanel";
import { ChipRow } from "@/components/system/ChipRow";
import { spring } from "@/lib/motion/tokens";

export function Workspace({ scene, phase }: { scene: Scene; phase: GenPhase }) {
  const reduce = useReducedMotion();
  const revealed = phase === "ready";

  return (
    <motion.div
      layout
      transition={reduce ? { duration: 0.2 } : spring.layout}
      className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      {/* Stage column */}
      <motion.div layout className="flex min-h-0 flex-col gap-3">
        <div className="relative min-h-[42vh] flex-1 lg:min-h-0">
          <MapStage stage={scene.stage} revealed={revealed} />
        </div>
        <ChipRow chips={scene.chips} phase={phase} />
      </motion.div>

      {/* Detail rail — persists across scenes so it can morph */}
      <motion.aside layout className="min-h-0 lg:overflow-y-auto">
        <AnimatePresence>
          {scene.detail && <DetailPanel key="detail" panel={scene.detail} phase={phase} />}
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  );
}
