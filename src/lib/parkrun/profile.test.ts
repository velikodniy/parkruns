import { assert, assertEquals } from "@std/assert";
import type { Athlete, Run, Weather } from "../../types.ts";
import type { EventContext } from "./event-context.ts";
import { buildProfile } from "./profile.ts";
import { getRegionKey } from "./regions.ts";
import type { LngLat } from "./types.ts";
import { getWeatherKey, type WeatherRun } from "./weather.ts";

const athlete: Athlete = {
  id: 123,
  firstName: "aLEX",
  lastName: "sMITH",
  clubName: "Test Club",
  homeRun: "Home parkrun",
};

function run(eventId: number, eventDate: string): Run {
  return {
    eventName: `Event ${eventId} parkrun`,
    eventId,
    eventEdition: eventId,
    eventDate,
    finishTime: "20:00",
    finishTimeSeconds: 1200,
    position: 1,
    totalFinishers: 100,
    genderPosition: 1,
    ageGrade: 70,
    ageCategory: "VM35-39",
    wasPb: false,
    wasFirstVisit: false,
  };
}

const runs = [
  run(1, "2026-08-08T00:00:00.000Z"),
  run(2, "2026-08-15T00:00:00.000Z"),
];

const knownEvent: EventContext = {
  coordinates: [51.4, -0.3],
  regionCoordinates: [-0.3, 51.4],
  countryISO: "gb",
  displayName: "Scheduled",
  eventUrl: "https://example.com/scheduled/",
  resultsUrl: "https://example.com/scheduled/results/1/",
};

const unknownEvent: EventContext = {
  coordinates: null,
  regionCoordinates: null,
  countryISO: "fr",
  displayName: "Unknown event",
  eventUrl: null,
  resultsUrl: null,
};

const weather: Weather = {
  temperatureC: 12,
  weatherCode: 1,
  windSpeedMs: 2,
  windDirectionDeg: 180,
};

Deno.test("buildProfile orchestrates context and enrichment once per run", async () => {
  let contextCalls = 0;
  let weatherRequests: readonly WeatherRun[] = [];
  let regionRequests: readonly LngLat[] = [];
  const warnings: string[] = [];

  const profile = await buildProfile({
    athlete,
    runs,
    eventCountries: ["fr", "gb"],
    resolveEventContext: ({ eventId }) => {
      contextCalls++;
      return eventId === 1 ? knownEvent : unknownEvent;
    },
    getShortNameByLongName: () => "Home",
    fetchWeather: (requests) => {
      weatherRequests = requests;
      return Promise.resolve(
        new Map([
          [
            getWeatherKey(
              knownEvent.coordinates!,
              runs[0].eventDate,
            ),
            weather,
          ],
        ]),
      );
    },
    resolveRegions: (coordinates) => {
      regionRequests = coordinates;
      return Promise.resolve(
        new Map([
          [getRegionKey(knownEvent.regionCoordinates!), "gb-eng"],
        ]),
      );
    },
    now: () => new Date("2026-08-18T12:00:00.000Z"),
    warn: (message) => warnings.push(message),
  });

  assertEquals(contextCalls, 2);
  assertEquals(weatherRequests, [{
    eventDate: runs[0].eventDate,
    coordinates: knownEvent.coordinates!,
  }]);
  assertEquals(regionRequests, [knownEvent.regionCoordinates!]);
  assertEquals(warnings, [
    "Skipping weather for 1 runs with no event coordinates",
  ]);
  assertEquals(profile.generatedAt, "2026-08-18T12:00:00.000Z");
  assertEquals(profile.eventCountries, ["fr", "gb"]);
  assertEquals(profile.athlete, {
    id: 123,
    fullName: "Alex Smith",
    clubName: "Test Club",
    homeRun: "Home parkrun",
    homeRunShortName: "Home",
  });
  assertEquals(profile.runs[0].countryISO, "gb-eng");
  assertEquals(profile.runs[0].weather, weather);
  assertEquals(profile.runs[1].countryISO, "fr");
  assertEquals(profile.runs[1].weather, null);
  assert(!Object.hasOwn(profile.runs[0], "regionCoordinates"));
});

Deno.test("buildProfile skips the home-run lookup when it is absent", async () => {
  let homeRunLookups = 0;

  const profile = await buildProfile({
    athlete: { ...athlete, homeRun: null },
    runs: [],
    eventCountries: [],
    resolveEventContext: () => knownEvent,
    getShortNameByLongName: () => {
      homeRunLookups++;
      return "unused";
    },
    fetchWeather: () => Promise.resolve(new Map()),
    resolveRegions: () => Promise.resolve(new Map()),
    now: () => new Date("2026-08-18T12:00:00.000Z"),
  });

  assertEquals(homeRunLookups, 0);
  assertEquals(profile.athlete.homeRunShortName, null);
});
