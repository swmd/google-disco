/**
 * Minimal, dependency-light assertions for the prompt → Scene engine.
 * Run with: npm test
 */
import { parsePrompt } from "../lib/intent/parser";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

// Flight (The Transition)
const flight = parsePrompt("Show my flight route from New York to London");
assert("flight intent", flight.intent === "flight");
assert("flight has both markers", flight.scene?.stage.markers.length === 2);
assert("flight origin is NYC", flight.scene?.stage.route?.from === "nyc");
assert("flight destination is London", flight.scene?.stage.route?.to === "lon");
assert("flight detail variant", flight.scene?.detail?.variant === "flight");

// Hotel (The Morph) — must share the same panel id to enable morphing
const hotel = parsePrompt("Show me my hotel details for London");
assert("hotel intent", hotel.intent === "hotel");
assert("hotel zooms in tighter than flight", (hotel.scene?.stage.camera.zoom ?? 0) > (flight.scene?.stage.camera.zoom ?? 0));
assert("hotel has no route", hotel.scene?.stage.route === null);
assert("panel id is stable across flight→hotel (enables morph)", flight.scene?.detail?.id === hotel.scene?.detail?.id && hotel.scene?.detail?.id === "detail");

// Weather + places
assert("weather intent", parsePrompt("weather in Tokyo").intent === "weather");
assert("places intent", parsePrompt("things to do in Paris").intent === "places");

// Edge cases
assert("bare place defaults to places", parsePrompt("London").intent === "places");
assert("gibberish returns fallback", parsePrompt("asdfghjkl").scene === null && !!parsePrompt("asdfghjkl").fallbackMessage);
assert("empty returns fallback", parsePrompt("").scene === null);

// Determinism
assert(
  "deterministic output",
  JSON.stringify(parsePrompt("hotel in Paris").scene) === JSON.stringify(parsePrompt("hotel in Paris").scene)
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
