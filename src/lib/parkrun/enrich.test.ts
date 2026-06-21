import { assertEquals } from "@std/assert";
import {
  attachCoordinates,
  type EnrichmentData,
  enrichRuns,
  type EventLookups,
  type RunWithCoordinates,
} from "./enrich.ts";
import { getWeatherKey } from "./weather.ts";
import { getRegionKey } from "./regions.ts";
import type { Run, Weather } from "../../types.ts";
import type { EventFeature, LatLng, LngLat } from "./types.ts";

const SAMPLE_WEATHER: Weather = {
  temperatureC: 9,
  weatherCode: 3,
  windSpeedMs: 4,
  windDirectionDeg: 180,
};

function makeRun(
  overrides: Partial<RunWithCoordinates> = {},
): RunWithCoordinates {
  return {
    eventName: "Brighton parkrun",
    eventId: 1,
    eventEdition: 100,
    eventDate: "2024-01-06T00:00:00.000Z",
    finishTime: "20:00",
    finishTimeSeconds: 1200,
    position: 10,
    totalFinishers: 100,
    genderPosition: 5,
    ageGrade: 65,
    ageCategory: "VM35-39",
    wasPb: false,
    wasFirstVisit: false,
    coordinates: [50.8, -0.1],
    ...overrides,
  };
}

function makeEvent(coordinates: LngLat): EventFeature {
  return {
    id: 1,
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {
      eventname: "brighton",
      EventLongName: "Brighton parkrun",
      EventShortName: "Brighton",
      LocalisedEventLongName: null,
      countrycode: 97,
      seriesid: 1,
      EventLocation: "",
    },
  };
}

function makeLookups(overrides: Partial<EventLookups> = {}): EventLookups {
  return {
    getCoordinates: () => [50.8, -0.1] as LatLng,
    getCountryISO: () => "fr",
    getEvent: () => makeEvent([-0.1, 50.8]),
    getShortName: () => "Brighton",
    getUrl: () => "https://parkrun.org.uk/brighton/",
    getResultsUrl: () => "https://parkrun.org.uk/brighton/results/100/",
    ...overrides,
  };
}

function emptyData(): EnrichmentData {
  return { weather: new Map(), regions: new Map() };
}

Deno.test("enrichRuns - attaches weather, names, and urls", () => {
  const run = makeRun();
  const data: EnrichmentData = {
    weather: new Map([
      [getWeatherKey(run.coordinates!, run.eventDate), SAMPLE_WEATHER],
    ]),
    regions: new Map(),
  };

  const [enriched] = enrichRuns([run], data, makeLookups());

  assertEquals(enriched.weather, SAMPLE_WEATHER);
  assertEquals(enriched.countryISO, "fr");
  assertEquals(enriched.eventName, "Brighton");
  assertEquals(enriched.eventUrl, "https://parkrun.org.uk/brighton/");
  assertEquals(
    enriched.resultsUrl,
    "https://parkrun.org.uk/brighton/results/100/",
  );
  assertEquals(enriched.coordinates, [50.8, -0.1]);
});

Deno.test("enrichRuns - refines a GB country to its region", () => {
  const run = makeRun();
  const event = makeEvent([-0.1, 50.8]);
  const data: EnrichmentData = {
    weather: new Map(),
    regions: new Map([[getRegionKey(event.geometry.coordinates), "gb-sct"]]),
  };

  const [enriched] = enrichRuns(
    [run],
    data,
    makeLookups({ getCountryISO: () => "gb", getEvent: () => event }),
  );

  assertEquals(enriched.countryISO, "gb-sct");
});

Deno.test("enrichRuns - keeps 'gb' when no region match exists", () => {
  const [enriched] = enrichRuns(
    [makeRun()],
    emptyData(),
    makeLookups({ getCountryISO: () => "gb" }),
  );
  assertEquals(enriched.countryISO, "gb");
});

Deno.test("enrichRuns - leaves weather null when the run has no coordinates", () => {
  const [enriched] = enrichRuns(
    [makeRun({ coordinates: null })],
    emptyData(),
    makeLookups(),
  );
  assertEquals(enriched.weather, null);
  assertEquals(enriched.coordinates, null);
});

Deno.test("enrichRuns - falls back to the stripped long name when no short name", () => {
  const [enriched] = enrichRuns(
    [makeRun({ eventName: "Hove Promenade parkrun" })],
    emptyData(),
    makeLookups({ getShortName: () => null }),
  );
  assertEquals(enriched.eventName, "Hove Promenade");
});

Deno.test("attachCoordinates - maps event coordinates onto each run", () => {
  const base = makeRun({ coordinates: undefined as unknown as LatLng });
  const result = attachCoordinates([base as Run], {
    getCoordinates: () => [1, 2] as LatLng,
  });
  assertEquals(result[0].coordinates, [1, 2]);
});
