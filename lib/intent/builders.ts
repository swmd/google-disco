/**
 * Scene builders: pure functions that turn resolved intent + places into a
 * concrete `Scene` (layout descriptor). Deterministic — the same prompt always
 * yields the same layout. Any per-scene mock data is derived from stable place
 * ids so there is no randomness between renders.
 */
import type { DetailPanel, Scene, StageBounds, StageMarker } from "./types";
import { project, type Place } from "./gazetteer";

function marker(place: Place, kind: StageMarker["kind"]): StageMarker {
  const { x, y } = project(place.lat, place.lng);
  return { id: place.id, label: place.name, kind, x, y };
}

/** Midpoint of two normalized points, nudged upward to fake a great-circle arc. */
export function arcMidpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 0.06 };
}

/**
 * A camera centred on `bounds` that must keep all of it in frame, never zoomed
 * tighter than `maxZoom`. The final zoom is resolved by <MapStage/>, which is
 * the only thing that knows the container's aspect ratio.
 */
export function cameraForBounds(bounds: StageBounds, maxZoom: number) {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    zoom: maxZoom,
    fit: bounds,
  };
}

/** Bounding box of some points, grown by `pad` to leave room for labels. */
export function boundsOf(points: { x: number; y: number }[], pad = 0.06): StageBounds {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs) - pad,
    minY: Math.min(...ys) - pad,
    maxX: Math.max(...xs) + pad,
    maxY: Math.max(...ys) + pad,
  };
}

// Small deterministic pseudo-data derived from a place id, so "flight 402"
// stays "flight 402" for New York every time without a Math.random call.
function hashInt(seed: string, mod: number, offset = 0): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % mod) + offset;
}

export function buildFlightScene(prompt: string, from: Place, to: Place): Scene {
  const a = marker(from, "origin");
  const b = marker(to, "destination");
  const mid = arcMidpoint(a, b);

  const flightNo = `BA ${hashInt(from.id + to.id, 8000, 100)}`;
  const durH = 6 + (hashInt(to.id, 5) as number);
  const durM = hashInt(from.id, 60);

  const detail: DetailPanel = {
    id: "detail",
    variant: "flight",
    eyebrow: "Flight",
    title: `${from.name} → ${to.name}`,
    subtitle: flightNo,
    accentTag: "On time",
    fields: [
      { label: "Duration", value: `${durH}h ${durM}m`, emphasis: true },
      { label: "Departs", value: `${from.name} · 21:40` },
      { label: "Arrives", value: `${to.name} · 09:${String(durM).padStart(2, "0")}` },
      { label: "Aircraft", value: "Boeing 787-9" },
    ],
    timeline: [
      { label: "Boarding", value: "21:10" },
      { label: "Take-off", value: "21:40" },
      { label: "Landing", value: `09:${String(durM).padStart(2, "0")}` },
    ],
  };

  return {
    key: `flight-${from.id}-${to.id}`,
    intent: "flight",
    prompt,
    headline: `Routing ${from.name} to ${to.name}`,
    stage: {
      kind: "map",
      // Frame the whole arc, not just its midpoint: a short hop stays at 1.25,
      // while a half-the-globe route (SF -> Sydney) pulls the camera back far
      // enough that both cities are actually on screen.
      camera: { ...cameraForBounds(boundsOf([a, b, mid]), 1.25) },
      markers: [a, b],
      route: { from: from.id, to: to.id },
      overlay: "none",
    },
    detail,
    chips: [flightNo, `${durH}h ${durM}m`, "Direct", "Gate A12"],
  };
}

export function buildHotelScene(prompt: string, place: Place): Scene {
  const focus = marker(place, "focus");
  const nights = hashInt(place.id, 4, 2);
  const rating = (85 + hashInt(place.id, 14)) / 10;

  const detail: DetailPanel = {
    id: "detail",
    variant: "hotel",
    eyebrow: "Hotel",
    title: `The Regent ${place.name}`,
    subtitle: `${12 + hashInt(place.id, 60)} Kingsway, ${place.name}`,
    accentTag: `★ ${rating.toFixed(1)}`,
    fields: [
      { label: "Check-in", value: "15:00", emphasis: true },
      { label: "Check-out", value: "11:00" },
      { label: "Nights", value: `${nights}` },
      { label: "Room", value: "Deluxe King, City View" },
    ],
    timeline: [
      { label: "Booking confirmed", value: "Today" },
      { label: "Check-in", value: `Thu · 15:00` },
      { label: "Check-out", value: `Sun · 11:00` },
    ],
  };

  return {
    key: `hotel-${place.id}`,
    intent: "hotel",
    prompt,
    headline: `Locating your stay in ${place.name}`,
    stage: {
      kind: "map",
      camera: { x: focus.x, y: focus.y, zoom: 3.4 }, // zoom in tight for the morph
      markers: [focus],
      route: null,
      overlay: "none",
    },
    detail,
    chips: [`★ ${rating.toFixed(1)}`, `${nights} nights`, "Free cancellation", "Breakfast included"],
  };
}

export function buildWeatherScene(prompt: string, place: Place): Scene {
  const focus = marker(place, "focus");
  const temp = 8 + hashInt(place.id, 22);
  const conditions = ["Clear", "Partly cloudy", "Light rain", "Overcast"][hashInt(place.id, 4)];

  const detail: DetailPanel = {
    id: "detail",
    variant: "weather",
    eyebrow: "Weather",
    title: `${place.name}`,
    subtitle: conditions,
    accentTag: `${temp}°C`,
    fields: [
      { label: "Now", value: `${temp}°C`, emphasis: true },
      { label: "Feels like", value: `${temp - 2}°C` },
      { label: "Humidity", value: `${50 + hashInt(place.id, 40)}%` },
      { label: "Wind", value: `${6 + hashInt(place.id, 20)} km/h` },
    ],
    timeline: [
      { label: "Morning", value: `${temp - 3}°C` },
      { label: "Afternoon", value: `${temp + 2}°C` },
      { label: "Evening", value: `${temp - 1}°C` },
    ],
  };

  return {
    key: `weather-${place.id}`,
    intent: "weather",
    prompt,
    headline: `Reading the skies over ${place.name}`,
    stage: {
      kind: "map",
      camera: { x: focus.x, y: focus.y, zoom: 2.6 },
      markers: [focus],
      route: null,
      overlay: "weather",
    },
    detail,
    chips: [`${temp}°C`, conditions, `UV ${hashInt(place.id, 8)}`, "Sunset 18:12"],
  };
}

export function buildPlacesScene(prompt: string, place: Place): Scene {
  const focus = marker(place, "focus");
  // Fan a few POIs around the focus point deterministically.
  const pois: StageMarker[] = Array.from({ length: 4 }).map((_, i) => {
    const angle = (i / 4) * Math.PI * 2 + hashInt(place.id, 6) / 6;
    return {
      id: `${place.id}-poi-${i}`,
      label: ["Cafe", "Museum", "Park", "Market"][i],
      kind: "poi" as const,
      x: focus.x + Math.cos(angle) * 0.05,
      y: focus.y + Math.sin(angle) * 0.05,
    };
  });

  const detail: DetailPanel = {
    id: "detail",
    variant: "places",
    eyebrow: "Nearby",
    title: `Things to do in ${place.name}`,
    subtitle: `${pois.length} highlights near you`,
    accentTag: "Curated",
    fields: pois.map((p) => ({ label: p.label, value: `${4 + hashInt(p.id, 6) / 10} ★` })),
  };

  return {
    key: `places-${place.id}`,
    intent: "places",
    prompt,
    headline: `Discovering ${place.name}`,
    stage: {
      kind: "map",
      camera: { x: focus.x, y: focus.y, zoom: 3.0 },
      markers: [focus, ...pois],
      route: null,
      overlay: "none",
    },
    detail,
    chips: pois.map((p) => p.label),
  };
}
