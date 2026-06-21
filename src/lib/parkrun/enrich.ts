import type { Run, Weather } from "../../types.ts";
import type { EventFeature, LatLng } from "./types.ts";
import { getWeatherKey } from "./weather.ts";
import { getRegionKey } from "./regions.ts";

/**
 * Event-metadata lookups the enrichment needs, injected rather than imported so
 * this module (and its tests) never has to load the ~900KB events.json. The
 * download script wires in the real implementations from events.ts.
 */
export interface EventLookups {
  getCoordinates(eventId: number): LatLng | null;
  getCountryISO(eventId: number): string | null;
  getEvent(eventId: number): EventFeature | undefined;
  getShortName(eventId: number): string | null;
  getUrl(eventId: number): string | null;
  getResultsUrl(eventId: number, edition: number): string | null;
}

/** Pre-fetched lookups keyed the same way enrichment reads them. */
export interface EnrichmentData {
  weather: Map<string, Weather | null>;
  regions: Map<string, string>;
}

export type RunWithCoordinates = Run & { coordinates: LatLng | null };

/**
 * Attach each run's event coordinates. Done as its own pure step because the
 * weather and region fetches both need coordinates before enrichment can run.
 */
export function attachCoordinates(
  runs: Run[],
  lookups: Pick<EventLookups, "getCoordinates">,
): RunWithCoordinates[] {
  return runs.map((run) => ({
    ...run,
    coordinates: lookups.getCoordinates(run.eventId),
  }));
}

function enrichRun(
  run: RunWithCoordinates,
  data: EnrichmentData,
  lookups: EventLookups,
): Run {
  const { coordinates } = run;

  // Weather is keyed by the run's LatLng (Open-Meteo order).
  const weather = coordinates
    ? data.weather.get(getWeatherKey(coordinates, run.eventDate)) ?? null
    : null;

  // For GB events, refine the country code to a region (e.g. "gb-sct"). The
  // region map is keyed by the event's GeoJSON LngLat, not the run's LatLng.
  let countryISO = lookups.getCountryISO(run.eventId);
  if (countryISO === "gb") {
    const event = lookups.getEvent(run.eventId);
    if (event) {
      countryISO = data.regions.get(
        getRegionKey(event.geometry.coordinates),
      ) ?? countryISO;
    }
  }

  return {
    ...run,
    coordinates,
    countryISO,
    eventName: lookups.getShortName(run.eventId) ??
      run.eventName.replace(/ parkrun$/i, ""),
    eventUrl: lookups.getUrl(run.eventId),
    resultsUrl: lookups.getResultsUrl(run.eventId, run.eventEdition),
    weather,
  };
}

/**
 * Pure enrichment step: merge pre-fetched weather and region data plus event
 * metadata onto each run. Separated from the download I/O so it can be tested
 * directly with fake lookups and maps.
 */
export function enrichRuns(
  runsWithCoordinates: RunWithCoordinates[],
  data: EnrichmentData,
  lookups: EventLookups,
): Run[] {
  return runsWithCoordinates.map((run) => enrichRun(run, data, lookups));
}
