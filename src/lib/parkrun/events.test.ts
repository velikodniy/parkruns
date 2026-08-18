import { assertEquals } from "@std/assert";
import { getEventWeatherHour, getRunEventContext } from "./events.ts";

Deno.test("getRunEventContext normalizes event metadata in one lookup", () => {
  assertEquals(
    getRunEventContext({
      eventId: 1,
      eventEdition: 100,
      eventDate: "2026-08-15T00:00:00.000Z",
      eventName: "Bushy parkrun",
    }),
    {
      coordinates: [51.410992, -0.335791],
      regionCoordinates: [-0.335791, 51.410992],
      countryISO: "gb",
      displayName: "Bushy Park",
      eventUrl: "https://www.parkrun.org.uk/bushy/",
      resultsUrl: "https://www.parkrun.org.uk/bushy/results/100/",
      weatherHour: 9,
    },
  );
});

Deno.test("getRunEventContext preserves a fallback for unknown events", () => {
  assertEquals(
    getRunEventContext({
      eventId: -1,
      eventEdition: 1,
      eventDate: "2026-08-15T00:00:00.000Z",
      eventName: "Unknown parkrun",
    }),
    {
      coordinates: null,
      regionCoordinates: null,
      countryISO: null,
      displayName: "Unknown",
      eventUrl: null,
      resultsUrl: null,
      weatherHour: null,
    },
  );
});

Deno.test("getEventWeatherHour - uses country and event start times", () => {
  assertEquals(getEventWeatherHour(1, "2026-01-03T00:00:00.000Z"), 9);
  assertEquals(getEventWeatherHour(336, "2026-01-03T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(434, "2026-01-03T00:00:00.000Z"), 7);
  assertEquals(getEventWeatherHour(471, "2026-01-03T00:00:00.000Z"), 7);
});

Deno.test("getEventWeatherHour - omits unknown variable event schedules", () => {
  assertEquals(getEventWeatherHour(25, "2026-01-03T00:00:00.000Z"), null);
  assertEquals(getEventWeatherHour(3281, "2026-08-15T00:00:00.000Z"), null);
  assertEquals(getEventWeatherHour(-1, "2026-01-03T00:00:00.000Z"), null);
});

Deno.test("getEventWeatherHour - applies northern seasonal schedules", () => {
  assertEquals(getEventWeatherHour(3718, "2026-05-09T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(3718, "2026-10-03T00:00:00.000Z"), 9);
  assertEquals(getEventWeatherHour(3745, "2026-05-02T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(3745, "2026-10-03T00:00:00.000Z"), 9);
});

Deno.test("getEventWeatherHour - follows New Zealand daylight saving", () => {
  assertEquals(getEventWeatherHour(1819, "2026-03-14T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(1819, "2026-04-11T00:00:00.000Z"), 9);
  assertEquals(getEventWeatherHour(1819, "2026-09-19T00:00:00.000Z"), 9);
  assertEquals(getEventWeatherHour(1819, "2026-10-03T00:00:00.000Z"), 8);
});

Deno.test("getEventWeatherHour - applies southern seasonal schedules", () => {
  assertEquals(getEventWeatherHour(2237, "2026-01-03T00:00:00.000Z"), 7);
  assertEquals(getEventWeatherHour(2237, "2026-04-04T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(2237, "2026-09-26T00:00:00.000Z"), 8);
  assertEquals(getEventWeatherHour(2237, "2026-10-03T00:00:00.000Z"), 7);
});
