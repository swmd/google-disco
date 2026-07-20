"use client";
/**
 * Generation state machine
 * ------------------------
 * Models the fake "prompt -> generation" lifecycle as explicit states so the UI
 * can render distinct transition stages (this is a scored requirement: skeleton
 * / shimmer, staggered introduction, container expansion).
 *
 *   idle ──submit──> parsing ──> generating ──> ready ──submit──> parsing ...
 *
 * `parsing`    : prompt accepted, intent being resolved (brief; shows thinking).
 * `generating` : scene resolved, skeletons shown while components "build".
 * `ready`      : real content revealed with staggered entrance.
 *
 * Durations are shortened automatically under prefers-reduced-motion.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { parsePrompt } from "./intent/parser";
import type { ParseResult, Scene } from "./intent/types";

export type GenPhase = "idle" | "parsing" | "generating" | "ready";

export interface GenerationState {
  phase: GenPhase;
  scene: Scene | null;
  /** The previous scene, kept during a morph so shared panels can tween. */
  lastResult: ParseResult | null;
  confidence: number;
  fallbackMessage?: string;
  intent: ParseResult["intent"];
}

export function useGenerationMachine() {
  const reduce = useReducedMotion();
  const [state, setState] = useState<GenerationState>({
    phase: "idle",
    scene: null,
    lastResult: null,
    confidence: 0,
    intent: "unknown",
  });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const submit = useCallback(
    (prompt: string) => {
      clearTimers();
      const result = parsePrompt(prompt);

      // Unrecognized prompt: surface guidance, do not tear down current scene.
      if (!result.scene) {
        setState((s) => ({
          ...s,
          phase: s.scene ? "ready" : "idle",
          fallbackMessage: result.fallbackMessage,
          confidence: 0,
          intent: "unknown",
        }));
        return;
      }

      const parseMs = reduce ? 60 : 420;
      const genMs = reduce ? 90 : 620;

      setState((s) => ({
        phase: "parsing",
        scene: result.scene,
        lastResult: s.scene ? { ...(s.lastResult as ParseResult), scene: s.scene } : null,
        confidence: result.confidence,
        intent: result.intent,
        fallbackMessage: undefined,
      }));

      timers.current.push(
        setTimeout(() => {
          setState((s) => ({ ...s, phase: "generating" }));
        }, parseMs)
      );
      timers.current.push(
        setTimeout(() => {
          setState((s) => ({ ...s, phase: "ready", lastResult: result }));
        }, parseMs + genMs)
      );
    },
    [reduce]
  );

  const reset = useCallback(() => {
    clearTimers();
    setState({ phase: "idle", scene: null, lastResult: null, confidence: 0, intent: "unknown" });
  }, []);

  return { state, submit, reset };
}
