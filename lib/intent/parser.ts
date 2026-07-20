/**
 * Intent parser: prompt text -> ParseResult (a Scene or a graceful fallback).
 *
 * Pipeline:
 *   1. Normalize   — lowercase, collapse whitespace.
 *   2. Classify    — score each intent by weighted keyword hits.
 *   3. Extract     — resolve place entities from the gazetteer.
 *   4. Reconcile   — apply per-intent arity rules (flight needs 2 places, etc.)
 *      and resolve CONFLICTS (e.g. both "flight" and "hotel" words present) by
 *      the higher score, with sensible fallbacks.
 *   5. Build       — hand off to a deterministic scene builder.
 *
 * Everything here is synchronous and pure so it is trivially testable and could
 * be swapped for an LLM call that returns the same Scene shape.
 */
import { findPlaces, PLACES, type Place } from "./gazetteer";
import type { IntentKind, ParseResult } from "./types";
import {
  buildFlightScene,
  buildHotelScene,
  buildPlacesScene,
  buildWeatherScene,
} from "./builders";

interface IntentSpec {
  kind: IntentKind;
  /** keyword -> weight */
  keywords: Record<string, number>;
  /** how many places this intent wants to fully resolve */
  arity: 1 | 2;
}

const INTENTS: IntentSpec[] = [
  {
    kind: "flight",
    arity: 2,
    keywords: { flight: 3, fly: 3, route: 2, flights: 3, "plane": 2, airfare: 2, trip: 1 },
  },
  {
    kind: "hotel",
    arity: 1,
    keywords: { hotel: 3, stay: 2, "check-in": 3, checkin: 3, room: 2, booking: 2, accommodation: 2, "where i'm staying": 3 },
  },
  {
    kind: "weather",
    arity: 1,
    keywords: { weather: 3, forecast: 3, temperature: 2, rain: 2, sunny: 2, climate: 2, temp: 2 },
  },
  {
    kind: "places",
    arity: 1,
    keywords: { restaurants: 3, food: 2, coffee: 2, things: 1, "to do": 2, nearby: 2, explore: 2, attractions: 3, sights: 2, places: 2 },
  },
];

function classify(text: string): { kind: IntentKind; score: number; matched: string[] }[] {
  return INTENTS.map((spec) => {
    const matched: string[] = [];
    let score = 0;
    for (const [kw, weight] of Object.entries(spec.keywords)) {
      if (text.includes(kw)) {
        score += weight;
        matched.push(kw);
      }
    }
    return { kind: spec.kind, score, matched };
  }).sort((a, b) => b.score - a.score);
}

/** Detect an explicit "from X to Y" ordering to fix origin/destination. */
function orderForRoute(text: string, places: Place[]): [Place, Place] {
  if (places.length < 2) return [places[0], places[1]];
  const fromIdx = text.indexOf(" from ");
  const toIdx = text.indexOf(" to ");
  if (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) {
    // places are already in appearance order; first is origin, second dest
    return [places[0], places[1]];
  }
  return [places[0], places[1]];
}

export function parsePrompt(raw: string): ParseResult {
  const text = ` ${raw.toLowerCase().replace(/\s+/g, " ").trim()} `;

  if (!raw.trim()) {
    return {
      scene: null,
      intent: "unknown",
      confidence: 0,
      matchedTokens: [],
      fallbackMessage: "Type a prompt to generate an interface.",
    };
  }

  const ranked = classify(text);
  const top = ranked[0];
  const places = findPlaces(text);

  // No recognized intent keyword at all.
  if (top.score === 0) {
    // If the user just named a place, default to a "places" overview.
    if (places.length > 0) {
      return {
        scene: buildPlacesScene(raw, places[0]),
        intent: "places",
        confidence: 0.4,
        matchedTokens: [places[0].name],
        fallbackMessage: undefined,
      };
    }
    return {
      scene: null,
      intent: "unknown",
      confidence: 0,
      matchedTokens: [],
      fallbackMessage:
        "Try: “Show my flight from New York to London”, “hotel in London”, or “weather in Tokyo”.",
    };
  }

  const spec = INTENTS.find((s) => s.kind === top.kind)!;
  const confidence = Math.min(1, top.score / 4 + Math.min(places.length, spec.arity) * 0.1);

  // --- Arity reconciliation & fallbacks -----------------------------------
  if (spec.kind === "flight") {
    // Flight wants two endpoints. Fill in sensible defaults if missing.
    let [from, to] = orderForRoute(text, places);
    if (!from && !to) {
      from = PLACES.find((p) => p.id === "nyc")!;
      to = PLACES.find((p) => p.id === "lon")!;
    } else if (from && !to) {
      // one city given: assume a route from a default hub to it (or vice versa)
      to = from.id === "lon" ? PLACES.find((p) => p.id === "nyc")! : PLACES.find((p) => p.id === "lon")!;
      [from, to] = from.id === "lon" ? [to, from] : [from, to];
    }
    return {
      scene: buildFlightScene(raw, from, to),
      intent: "flight",
      confidence,
      matchedTokens: [...top.matched, from.name, to.name],
    };
  }

  // Single-place intents (hotel / weather / places).
  const place = places[0] ?? PLACES.find((p) => p.id === "lon")!;
  const builder =
    spec.kind === "hotel"
      ? buildHotelScene
      : spec.kind === "weather"
        ? buildWeatherScene
        : buildPlacesScene;

  return {
    scene: builder(raw, place),
    intent: spec.kind,
    confidence,
    matchedTokens: [...top.matched, place.name],
  };
}

/** Curated example prompts surfaced in the UI to guide the user. */
export const EXAMPLE_PROMPTS: string[] = [
  "Show my flight route from New York to London",
  "Show me my hotel details for London",
  "What's the weather in Tokyo",
  "Things to do in Paris",
  "Flight from San Francisco to Sydney",
];
