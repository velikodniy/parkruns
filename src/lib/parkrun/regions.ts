import { JsonCache } from "../cache.ts";
import type { Coordinates } from "./types.ts";

const cache = new JsonCache<string>("regions.json");
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "parkrun-dashboard/1.0";
const RATE_LIMIT_MS = 1100;

function coordsKey(coordinates: Coordinates): string {
  return `${coordinates[0]},${coordinates[1]}`;
}

async function fetchRegion(coordinates: Coordinates): Promise<string> {
  const [longitude, latitude] = coordinates;
  const url =
    `${NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=5`;
  const resp = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!resp.ok) throw new Error(`Nominatim error: ${resp.status}`);
  const data = await resp.json();

  const iso2 = data.address?.["ISO3166-2-lvl4"] as string | undefined;
  if (iso2) return iso2.toLowerCase();

  const country = data.address?.country_code as string | undefined;
  if (country) return country.toLowerCase();

  return "gb";
}

export function resolveRegions(
  events: ReadonlyArray<{ coordinates: Coordinates }>,
): Promise<Map<string, string>> {
  const keyToCoords = new Map(
    events.map((e) => [coordsKey(e.coordinates), e.coordinates]),
  );

  return cache.resolve([...keyToCoords.keys()], async (missing) => {
    const results = new Map<string, string>();
    console.log(`Fetching ${missing.length} region(s) from Nominatim`);
    for (let i = 0; i < missing.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      results.set(missing[i], await fetchRegion(keyToCoords.get(missing[i])!));
      console.log(`  Region progress: ${i + 1}/${missing.length}`);
    }
    return results;
  });
}

export function getRegionKey(coordinates: Coordinates): string {
  return coordsKey(coordinates);
}
