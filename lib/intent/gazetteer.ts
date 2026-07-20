/**
 * A tiny gazetteer: the set of places the parser can resolve, plus a
 * projection from lat/lng to the stage's normalized 0..1 coordinate space.
 *
 * Kept deliberately small and local — this is a deterministic demo, not a geo
 * service. Adding a place is a one-line data change.
 */

export interface Place {
  id: string;
  /** Canonical display name. */
  name: string;
  /** Lowercased strings that should resolve to this place. */
  aliases: string[];
  lat: number;
  lng: number;
  country: string;
}

export const PLACES: Place[] = [
  { id: "nyc", name: "New York", aliases: ["new york", "nyc", "new york city"], lat: 40.71, lng: -74.0, country: "USA" },
  { id: "lon", name: "London", aliases: ["london", "ldn"], lat: 51.5, lng: -0.13, country: "UK" },
  { id: "par", name: "Paris", aliases: ["paris"], lat: 48.85, lng: 2.35, country: "France" },
  { id: "tok", name: "Tokyo", aliases: ["tokyo"], lat: 35.68, lng: 139.69, country: "Japan" },
  { id: "sfo", name: "San Francisco", aliases: ["san francisco", "sf", "san fran"], lat: 37.77, lng: -122.42, country: "USA" },
  { id: "sin", name: "Singapore", aliases: ["singapore"], lat: 1.35, lng: 103.82, country: "Singapore" },
  { id: "syd", name: "Sydney", aliases: ["sydney"], lat: -33.87, lng: 151.21, country: "Australia" },
  { id: "dxb", name: "Dubai", aliases: ["dubai"], lat: 25.2, lng: 55.27, country: "UAE" },
  { id: "ber", name: "Berlin", aliases: ["berlin"], lat: 52.52, lng: 13.4, country: "Germany" },
  { id: "rio", name: "Rio de Janeiro", aliases: ["rio", "rio de janeiro"], lat: -22.9, lng: -43.17, country: "Brazil" },
];

/**
 * Equirectangular projection onto the stage.
 * The stylized world map in <MapStage/> is laid out on this same projection,
 * so a projected marker lands on the matching landmass.
 */
export function project(lat: number, lng: number): { x: number; y: number } {
  const x = (lng + 180) / 360;
  const y = (90 - lat) / 180;
  return { x, y };
}

const NORMALIZED_ALIASES = PLACES.flatMap((p) =>
  p.aliases.map((a) => ({ alias: a, place: p }))
).sort((a, b) => b.alias.length - a.alias.length); // longest-match-first

/** Find every place mentioned in a lowercased prompt, in order of appearance. */
export function findPlaces(text: string): Place[] {
  const found: { place: Place; index: number }[] = [];
  const claimed: Array<[number, number]> = [];

  for (const { alias, place } of NORMALIZED_ALIASES) {
    let from = 0;
    // word-boundary-ish search so "sf" doesn't match inside "surf"
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + alias.length;
      const overlaps = claimed.some(([s, e]) => start < e && end > s);
      if (!overlaps && !found.some((f) => f.place.id === place.id)) {
        found.push({ place, index: start });
        claimed.push([start, end]);
      }
      from = end;
    }
  }

  return found.sort((a, b) => a.index - b.index).map((f) => f.place);
}
