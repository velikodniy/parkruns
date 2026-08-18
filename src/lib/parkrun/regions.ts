import { JsonCache } from "../cache.ts";
import type { LngLat } from "./types.ts";
import { z } from "zod";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "parkrun-dashboard/1.0";
// Regularly-run scripts are limited to four requests per minute.
// https://operations.osmfoundation.org/policies/nominatim/
export const NOMINATIM_REQUEST_INTERVAL_MS = 15_000;

const ResolvedRegionSchema = z.string().min(1).refine((value) =>
  value !== "gb"
);

const cache = new JsonCache<string>("regions.json", {
  schema: ResolvedRegionSchema,
});

function coordsKey(coordinates: LngLat): string {
  return `${coordinates[0]},${coordinates[1]}`;
}

export async function fetchRegion(
  coordinates: LngLat,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const [longitude, latitude] = coordinates;
  const url =
    `${NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=5`;

  try {
    const resp = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!resp.ok) {
      console.error(
        `Nominatim error: ${resp.status} for ${latitude},${longitude}`,
      );
      return null;
    }
    const data = await resp.json();

    const iso2 = data.address?.["ISO3166-2-lvl4"] as string | undefined;
    if (iso2) return iso2.toLowerCase();

    const country = data.address?.country_code as string | undefined;
    if (country && country.toLowerCase() !== "gb") {
      return country.toLowerCase();
    }

    return null;
  } catch (error) {
    console.error(
      `Failed to fetch region for ${latitude},${longitude}:`,
      error,
    );
    return null;
  }
}

export function resolveRegions(
  coordinates: readonly LngLat[],
): Promise<Map<string, string>> {
  const keyToCoords = new Map(
    coordinates.map((value) => [coordsKey(value), value]),
  );

  return cache.resolve([...keyToCoords.keys()], async (missing) => {
    const results = new Map<string, string>();
    console.log(`Fetching ${missing.length} region(s) from Nominatim`);
    for (let i = 0; i < missing.length; i++) {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, NOMINATIM_REQUEST_INTERVAL_MS));
      }
      const region = await fetchRegion(keyToCoords.get(missing[i])!);
      if (region) results.set(missing[i], region);
      console.log(`  Region progress: ${i + 1}/${missing.length}`);
    }
    return results;
  });
}

export function getRegionKey(coordinates: LngLat): string {
  return coordsKey(coordinates);
}
