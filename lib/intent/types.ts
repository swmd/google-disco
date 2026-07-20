/**
 * Layout Descriptor Schema
 * ------------------------
 * A `Scene` is a normalized, serializable description of a UI layout. The
 * intent parser produces one from a text prompt; the renderer consumes one to
 * draw the interface. Nothing between the parser and the renderer knows about
 * strings — they only pass this schema around.
 *
 * This indirection is the whole architecture:
 *   prompt  ->  [parser]  ->  Scene (JSON)  ->  [renderer]  ->  UI
 *
 * Because every panel carries a STABLE `id` that is reused across scenes,
 * Framer Motion can treat same-id panels as the same physical element and
 * morph one into the next (FLIP) instead of unmounting + remounting. That is
 * what makes "The Morph" (flight details -> hotel card) continuous.
 *
 * A live LLM would simply emit this same JSON shape; the renderer would not
 * change. See DESIGN.md "Future scalability".
 */

export type IntentKind = "flight" | "hotel" | "weather" | "places" | "unknown";

/** A point on the stage, in normalized 0..1 map coordinates. */
export interface StageMarker {
  id: string;
  label: string;
  kind: "origin" | "destination" | "focus" | "poi";
  x: number;
  y: number;
}

/** A normalized 0..1 rectangle on the stage. */
export interface StageBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Camera framing for the map stage. `zoom` of 1 shows the whole map.
 *
 * `fit` is the descriptor's way of saying "this region must stay in frame"
 * without knowing anything about pixels. The builder can't compute a zoom that
 * frames a route, because the answer depends on the container's aspect ratio at
 * render time — so it states the intent and <MapStage/> resolves it, treating
 * `zoom` as the tightest allowed framing. Scenes with a single focal point omit
 * `fit` and simply use `zoom`.
 */
export interface StageCamera {
  x: number; // focal point, normalized
  y: number;
  zoom: number;
  fit?: StageBounds;
}

export interface StageConfig {
  kind: "map";
  camera: StageCamera;
  markers: StageMarker[];
  /** Marker id pair to connect with an animated great-circle-ish path. */
  route: { from: string; to: string } | null;
  overlay: "none" | "weather";
}

export interface DetailField {
  label: string;
  value: string;
  /** Rendered larger / bolder to establish hierarchy. */
  emphasis?: boolean;
}

export interface TimelineStep {
  label: string;
  value: string;
}

/**
 * The detail panel. Its `id` is always "detail" so that a flight panel and a
 * hotel panel are recognized as the same element and morph between variants.
 */
export interface DetailPanel {
  id: "detail";
  variant: IntentKind;
  eyebrow: string;
  title: string;
  subtitle?: string;
  accentTag?: string;
  fields: DetailField[];
  timeline?: TimelineStep[];
}

export interface Scene {
  /** Stable id for the whole scene render pass. */
  key: string;
  intent: IntentKind;
  prompt: string;
  /** Human-readable summary of what is being "generated" (used in status UI). */
  headline: string;
  stage: StageConfig;
  detail: DetailPanel | null;
  /** Quick facts rendered as staggered chips under the stage. */
  chips: string[];
}

/** Result of parsing, including diagnostics for edge-case / empty handling. */
export interface ParseResult {
  scene: Scene | null;
  intent: IntentKind;
  confidence: number; // 0..1, drives the "did we understand you?" affordance
  matchedTokens: string[];
  /** User-facing hint when we could not build a scene. */
  fallbackMessage?: string;
}
