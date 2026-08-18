import { assertEquals } from "@std/assert";
import type { Run, Weather } from "../../types.ts";
import type { ContextualRun, EventContext } from "./event-context.ts";
import { type EnrichmentData, enrichRuns } from "./enrich.ts";
import { getRegionKey } from "./regions.ts";
import { getWeatherKey } from "./weather.ts";

const SAMPLE_WEATHER: Weather = {
  temperatureC: 9,
  weatherCode: 3,
  windSpeedMs: 4,
  windDirectionDeg: 180,
};

function makeRun(overrides: Partial<Run> = {}): Run {
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
    ...overrides,
  };
}

function makeEvent(overrides: Partial<EventContext> = {}): EventContext {
  return {
    coordinates: [50.8, -0.1],
    regionCoordinates: [-0.1, 50.8],
    countryISO: "fr",
    displayName: "Brighton",
    eventUrl: "https://parkrun.org.uk/brighton/",
    resultsUrl: "https://parkrun.org.uk/brighton/results/100/",
    weatherHour: 9,
    ...overrides,
  };
}

function contextualRun(
  runOverrides: Partial<Run> = {},
  eventOverrides: Partial<EventContext> = {},
): ContextualRun {
  return {
    run: makeRun(runOverrides),
    event: makeEvent(eventOverrides),
  };
}

function emptyData(): EnrichmentData {
  return { weather: new Map(), regions: new Map() };
}

Deno.test("enrichRuns - attaches weather and normalized event metadata", () => {
  const contextual = contextualRun();
  const data: EnrichmentData = {
    weather: new Map([
      [
        getWeatherKey(
          contextual.event.coordinates!,
          contextual.run.eventDate,
          contextual.event.weatherHour!,
        ),
        SAMPLE_WEATHER,
      ],
    ]),
    regions: new Map(),
  };

  const [enriched] = enrichRuns([contextual], data);

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
  const contextual = contextualRun({}, { countryISO: "gb" });
  const data: EnrichmentData = {
    weather: new Map(),
    regions: new Map([
      [getRegionKey(contextual.event.regionCoordinates!), "gb-sct"],
    ]),
  };

  const [enriched] = enrichRuns([contextual], data);

  assertEquals(enriched.countryISO, "gb-sct");
});

Deno.test("enrichRuns - keeps 'gb' when no region match exists", () => {
  const [enriched] = enrichRuns(
    [contextualRun({}, { countryISO: "gb" })],
    emptyData(),
  );
  assertEquals(enriched.countryISO, "gb");
});

Deno.test("enrichRuns - leaves weather null when coordinates are missing", () => {
  const [enriched] = enrichRuns(
    [
      contextualRun({}, {
        coordinates: null,
        regionCoordinates: null,
      }),
    ],
    emptyData(),
  );
  assertEquals(enriched.weather, null);
  assertEquals(enriched.coordinates, null);
});

Deno.test("enrichRuns - omits weather when the event schedule is unknown", () => {
  const contextual = contextualRun({}, { weatherHour: null });
  const data: EnrichmentData = {
    weather: new Map([
      [
        getWeatherKey(
          contextual.event.coordinates!,
          contextual.run.eventDate,
          9,
        ),
        SAMPLE_WEATHER,
      ],
    ]),
    regions: new Map(),
  };

  const [enriched] = enrichRuns([contextual], data);

  assertEquals(enriched.weather, null);
});
