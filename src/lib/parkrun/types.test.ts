import { assertThrows } from "@std/assert";
import { EventsDataSchema } from "./types.ts";

const validEventsData = {
  countries: {
    "97": {
      url: "www.parkrun.org.uk",
      bounds: [-8.6, 49.9, 1.8, 59.4],
    },
  },
  events: {
    type: "FeatureCollection",
    features: [{
      id: 1,
      type: "Feature",
      geometry: { type: "Point", coordinates: [-0.3, 51.4] },
      properties: {
        eventname: "bushy",
        EventLongName: "Bushy parkrun",
        EventShortName: "Bushy Park",
        LocalisedEventLongName: null,
        countrycode: 97,
        seriesid: 1,
        EventLocation: "Bushy Park, Teddington",
      },
    }],
  },
};

Deno.test("EventsDataSchema accepts complete event data", () => {
  EventsDataSchema.parse(validEventsData);
});

Deno.test("EventsDataSchema rejects incomplete event features", () => {
  const invalid = structuredClone(validEventsData);
  Reflect.deleteProperty(invalid.events.features[0], "geometry");

  assertThrows(() => EventsDataSchema.parse(invalid));
});

Deno.test("EventsDataSchema rejects missing country metadata", () => {
  const invalid = { ...structuredClone(validEventsData), countries: {} };

  assertThrows(() => EventsDataSchema.parse(invalid));
});

Deno.test("EventsDataSchema rejects duplicate event ids", () => {
  const invalid = structuredClone(validEventsData);
  invalid.events.features.push(structuredClone(invalid.events.features[0]));

  assertThrows(() => EventsDataSchema.parse(invalid));
});
