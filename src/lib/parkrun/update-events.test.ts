import { assertThrows } from "@std/assert";
import { validateEventsUpdate } from "./types.ts";

function eventsData(eventCount: number) {
  return {
    countries: {
      "97": {
        url: "www.parkrun.org.uk",
        bounds: [-8.6, 49.9, 1.8, 59.4],
      },
    },
    events: {
      type: "FeatureCollection",
      features: Array.from({ length: eventCount }, (_, index) => ({
        id: index + 1,
        type: "Feature",
        geometry: { type: "Point", coordinates: [-0.3, 51.4] },
        properties: {
          eventname: `event-${index + 1}`,
          EventLongName: `Event ${index + 1} parkrun`,
          EventShortName: `Event ${index + 1}`,
          LocalisedEventLongName: null,
          countrycode: 97,
          seriesid: 1,
          EventLocation: "Test location",
        },
      })),
    },
  };
}

Deno.test("validateEventsUpdate rejects a destructive partial feed", () => {
  assertThrows(
    () => validateEventsUpdate(eventsData(100), eventsData(50)),
    Error,
    "expected at least 90",
  );
});
