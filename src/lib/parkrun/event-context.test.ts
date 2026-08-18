import { assertEquals } from "@std/assert";
import type { Run } from "../../types.ts";
import { contextualizeRuns, type EventContext } from "./event-context.ts";

const run: Run = {
  eventName: "Test parkrun",
  eventId: 1,
  eventEdition: 2,
  eventDate: "2026-08-15T00:00:00.000Z",
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

Deno.test("contextualizeRuns resolves each run once", () => {
  const event: EventContext = {
    coordinates: [51.4, -0.3],
    regionCoordinates: [-0.3, 51.4],
    countryISO: "gb",
    displayName: "Test",
    eventUrl: null,
    resultsUrl: null,
  };
  let calls = 0;

  const result = contextualizeRuns([run], (input) => {
    calls++;
    assertEquals(input, run);
    return event;
  });

  assertEquals(calls, 1);
  assertEquals(result, [{ run, event }]);
});
