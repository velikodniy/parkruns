import { assertEquals } from "@std/assert";
import { getRunEventContext } from "./events.ts";

Deno.test("getRunEventContext normalizes event metadata in one lookup", () => {
  assertEquals(
    getRunEventContext({
      eventId: 1,
      eventEdition: 100,
      eventName: "Bushy parkrun",
    }),
    {
      coordinates: [51.410992, -0.335791],
      regionCoordinates: [-0.335791, 51.410992],
      countryISO: "gb",
      displayName: "Bushy Park",
      eventUrl: "https://www.parkrun.org.uk/bushy/",
      resultsUrl: "https://www.parkrun.org.uk/bushy/results/100/",
    },
  );
});

Deno.test("getRunEventContext preserves a fallback for unknown events", () => {
  assertEquals(
    getRunEventContext({
      eventId: -1,
      eventEdition: 1,
      eventName: "Unknown parkrun",
    }),
    {
      coordinates: null,
      regionCoordinates: null,
      countryISO: null,
      displayName: "Unknown",
      eventUrl: null,
      resultsUrl: null,
    },
  );
});
