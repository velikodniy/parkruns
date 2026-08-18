import type { Run, Weather } from "../../types.ts";
import type { ContextualRun } from "./event-context.ts";
import { getWeatherKey } from "./weather.ts";
import { getRegionKey } from "./regions.ts";

/** Pre-fetched lookups keyed the same way enrichment reads them. */
export interface EnrichmentData {
  weather: ReadonlyMap<string, Weather>;
  regions: ReadonlyMap<string, string>;
}

function enrichRun(
  contextualRun: ContextualRun,
  data: EnrichmentData,
): Run {
  const { run, event } = contextualRun;

  // Weather is keyed by the run's LatLng (Open-Meteo order).
  const weather = event.coordinates && event.weatherHour !== null
    ? data.weather.get(
      getWeatherKey(
        event.coordinates,
        run.eventDate,
        event.weatherHour,
      ),
    ) ?? null
    : null;

  // For GB events, refine the country code to a region (e.g. "gb-sct"). The
  // region map is keyed by the event's GeoJSON LngLat, not the run's LatLng.
  let countryISO = event.countryISO;
  if (countryISO === "gb" && event.regionCoordinates) {
    countryISO = data.regions.get(
      getRegionKey(event.regionCoordinates),
    ) ?? countryISO;
  }

  return {
    ...run,
    coordinates: event.coordinates,
    countryISO,
    eventName: event.displayName,
    eventUrl: event.eventUrl,
    resultsUrl: event.resultsUrl,
    weather,
  };
}

/**
 * Pure enrichment step: merge pre-fetched weather and region data plus event
 * metadata onto each run. Separated from the download I/O so it can be tested
 * directly with normalized event contexts and maps.
 */
export function enrichRuns(
  contextualRuns: readonly ContextualRun[],
  data: EnrichmentData,
): Run[] {
  return contextualRuns.map((run) => enrichRun(run, data));
}
