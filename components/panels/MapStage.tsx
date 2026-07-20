"use client";
/**
 * MapStage — the persistent "parent map view" from the assessment examples.
 *
 * It never unmounts between scenes; instead its CAMERA (scale + pan) animates,
 * markers cross-fade, and the route path draws/erases itself. This continuity
 * is what lets a flight scene morph into a hotel scene without a flash.
 *
 * Coordinate space: a 1000x500 equirectangular field (matches gazetteer
 * projection). Camera zoom counter-scales markers so their labels stay crisp.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StageCamera, StageConfig, StageMarker } from "@/lib/intent/types";
import { spring } from "@/lib/motion/tokens";
import { arcMidpoint } from "@/lib/intent/builders";

const VIEW_W = 1000;
const VIEW_H = 500;
const FIELD_ASPECT = VIEW_W / VIEW_H;

/**
 * Below 1 the field no longer covers the container — but since it sits on the
 * water fill, the surrounding area reads as open ocean rather than a gap, so
 * pulling back a little to fit a long-haul route is safe.
 */
const MIN_ZOOM = 0.6;

/**
 * What fraction of the 2:1 field is visible through the container at zoom 1.
 * The field covers, so it overflows on one axis and that axis shows less than
 * all of the map. Everything below is expressed in these terms.
 */
function visibleFraction(aspect: number) {
  const wide = aspect >= FIELD_ASPECT;
  return {
    x: wide ? 1 : aspect / FIELD_ASPECT,
    y: wide ? FIELD_ASPECT / aspect : 1,
  };
}

/**
 * Resolve `camera.fit` against the container's real aspect ratio: the largest
 * zoom that still frames the requested bounds, never tighter than the scene's
 * authored `zoom`.
 */
function resolveZoom(cam: StageCamera, aspect: number): number {
  if (!cam.fit || !Number.isFinite(aspect) || aspect <= 0) return cam.zoom;
  const visible = visibleFraction(aspect);
  const spanX = Math.max(cam.fit.maxX - cam.fit.minX, 1e-3);
  const spanY = Math.max(cam.fit.maxY - cam.fit.minY, 1e-3);
  const fitted = Math.min(visible.x / spanX, visible.y / spanY);
  return Math.max(MIN_ZOOM, Math.min(cam.zoom, fitted));
}

/** Container aspect ratio, tracked live so the framing survives a resize. */
function useAspect(ref: React.RefObject<HTMLElement>): number {
  const [aspect, setAspect] = useState(FIELD_ASPECT);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return aspect;
}

/** Stylized continents as clusters of soft ellipses (abstract, not geographic). */
const CONTINENTS: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 232, cy: 132, rx: 92, ry: 70 }, // N. America
  { cx: 196, cy: 196, rx: 46, ry: 40 }, // Central America
  { cx: 322, cy: 322, rx: 46, ry: 60 }, // S. America (N)
  { cx: 344, cy: 384, rx: 30, ry: 46 }, // S. America (S)
  { cx: 516, cy: 126, rx: 46, ry: 34 }, // Europe
  { cx: 542, cy: 244, rx: 60, ry: 78 }, // Africa
  { cx: 676, cy: 142, rx: 132, ry: 70 }, // Asia (W/central)
  { cx: 830, cy: 168, rx: 66, ry: 48 }, // Asia (E)
  { cx: 802, cy: 250, rx: 34, ry: 30 }, // SE Asia
  { cx: 882, cy: 342, rx: 56, ry: 38 }, // Australia
];

/**
 * A translate percentage here resolves against the CAMERA LAYER (container
 * size), but the offset we want is in map units, which live on the FIELD. The
 * field is 1/visible times larger than the container on each axis, so the
 * percentage has to be scaled by that ratio — otherwise panning undershoots
 * and the focal point drifts off centre.
 */
function cameraTransform(cam: StageConfig["camera"], z: number, aspect: number) {
  const visible = visibleFraction(aspect);
  return {
    scale: z,
    x: `${(-z * (cam.x - 0.5) * 100) / visible.x}%`,
    y: `${(-z * (cam.y - 0.5) * 100) / visible.y}%`,
  };
}

export function MapStage({ stage, revealed }: { stage: StageConfig; revealed: boolean }) {
  const reduce = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const cam = stage.camera;
  const aspect = useAspect(hostRef);
  const zoom = resolveZoom(cam, aspect);
  const invScale = 1 / zoom;

  const from = stage.route ? stage.markers.find((m) => m.id === stage.route!.from) : undefined;
  const to = stage.route ? stage.markers.find((m) => m.id === stage.route!.to) : undefined;

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border bg-[rgb(var(--map-water))]"
      role="img"
      aria-label={
        stage.route
          ? `Map showing a route from ${from?.label} to ${to?.label}`
          : `Map focused on ${stage.markers[0]?.label ?? "a location"}`
      }
    >
      {/* Camera layer: everything geographic lives in here and pans/zooms together */}
      <motion.div
        className="absolute inset-0 [container-type:size]"
        style={{ transformOrigin: "50% 50%" }}
        animate={reduce ? { scale: zoom } : cameraTransform(cam, zoom, aspect)}
        transition={reduce ? { duration: 0.2 } : spring.camera}
      >
        {/* Projection field. The SVG and the HTML markers MUST share one
            coordinate space or markers drift off their landmasses. This box is
            locked to the viewBox's 2:1 ratio and sized to cover the camera
            layer (the CSS equivalent of object-fit: cover), so a marker at
            left:x% always lands on SVG x = x * VIEW_W. */}
        <div className="absolute left-1/2 top-1/2 w-[max(100%,200cqh)] -translate-x-1/2 -translate-y-1/2 aspect-[2/1]">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* graticule */}
            <g stroke="rgb(var(--map-line))" strokeWidth={1} opacity={0.6}>
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`v${i}`} x1={(i * VIEW_W) / 10} y1={0} x2={(i * VIEW_W) / 10} y2={VIEW_H} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={(i * VIEW_H) / 5} x2={VIEW_W} y2={(i * VIEW_H) / 5} />
              ))}
            </g>
            {/* landmasses */}
            <g fill="rgb(var(--map-land))" stroke="rgb(var(--map-line))" strokeWidth={1.5}>
              {CONTINENTS.map((c, i) => (
                <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />
              ))}
            </g>

            {/* Route path: draws itself, and erases on exit (flight -> hotel) */}
            <AnimatePresence>
              {from && to && (
                <RoutePath key="route" from={from} to={to} zoom={zoom} reduce={!!reduce} />
              )}
            </AnimatePresence>
          </svg>

          {/* Marker layer (HTML, so labels get real typography). Counter-scaled.
              Lives inside the field, so its percentages match the SVG exactly. */}
          {stage.markers.map((m) => (
            <Marker key={m.id} marker={m} invScale={invScale} revealed={revealed} reduce={!!reduce} />
          ))}
        </div>
      </motion.div>

      {/* Fixed vignette for depth; not part of the camera */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_120px_rgb(0_0_0/0.06)]" />
    </div>
  );
}

function RoutePath({
  from,
  to,
  zoom,
  reduce,
}: {
  from: StageMarker;
  to: StageMarker;
  zoom: number;
  reduce: boolean;
}) {
  const a = { x: from.x * VIEW_W, y: from.y * VIEW_H };
  const b = { x: to.x * VIEW_W, y: to.y * VIEW_H };
  const mid = arcMidpoint({ x: from.x, y: from.y }, { x: to.x, y: to.y });
  const c = { x: mid.x * VIEW_W, y: mid.y * VIEW_H };
  const d = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;

  return (
    <motion.path
      d={d}
      fill="none"
      stroke="rgb(var(--accent))"
      // NOT vectorEffect="non-scaling-stroke": it makes the browser compute the
      // dash pattern in screen space, while Motion's pathLength draw normalises
      // dashes to user space. They disagree by exactly the camera zoom, so only
      // 1/zoom of the route ever gets painted and it stops short of its
      // destination. Counter-scaling the width keeps the weight constant instead.
      strokeWidth={2.5 / zoom}
      strokeLinecap="round"
      initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ pathLength: { duration: reduce ? 0.01 : 1.1, ease: [0.2, 0, 0, 1] }, opacity: { duration: 0.2 } }}
    />
  );
}

function Marker({
  marker,
  invScale,
  revealed,
  reduce,
}: {
  marker: StageMarker;
  invScale: number;
  revealed: boolean;
  reduce: boolean;
}) {
  const isPoi = marker.kind === "poi";
  const accent = marker.kind === "destination" || marker.kind === "focus";
  const dot = isPoi ? "h-2 w-2 bg-ink" : "h-3 w-3";
  return (
    // Zero-size anchor sitting exactly on the projected point. Children are
    // absolutely positioned around it, so the counter-scale below can never
    // shift the dot off the coordinate (an inline `transform` from Motion
    // silently overrides Tailwind's translate utilities on the same element).
    <motion.div
      className="absolute z-10 h-0 w-0"
      style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute h-0 w-0"
        animate={{ scale: invScale }}
        transition={reduce ? { duration: 0.2 } : spring.camera}
        style={{ transformOrigin: "center" }}
      >
        {!reduce && !isPoi && (
          <motion.span
            className="absolute left-0 top-0 h-3 w-3 rounded-full"
            // x/y (not Tailwind translate) so centring composes with `scale`.
            style={{ x: "-50%", y: "-50%", backgroundColor: accent ? "rgb(var(--accent))" : "rgb(var(--ink))" }}
            animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface ${dot}`}
          style={!isPoi ? { backgroundColor: accent ? "rgb(var(--accent))" : "rgb(var(--ink))" } : undefined}
        />
        {!isPoi && (
          <span className="absolute left-0 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface/90 px-2 py-0.5 text-2xs font-medium text-ink shadow-card backdrop-blur">
            {marker.label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
