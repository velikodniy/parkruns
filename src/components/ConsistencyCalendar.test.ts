import { assertEquals } from "@std/assert";
import type { Run } from "../types.ts";
import { buildCalendarYearData } from "./ConsistencyCalendar.tsx";

function run(eventDate: string, eventId: number): Run {
  return {
    eventName: "Test",
    eventId,
    eventEdition: 1,
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

Deno.test("calendar keeps New Year's Day runs in their calendar year", () => {
  const years = buildCalendarYearData([
    run("2021-12-31T00:00:00.000Z", 1),
    run("2022-01-01T00:00:00.000Z", 2),
  ]);
  const occupiedWeeks = years.flatMap(({ year, weeks }) =>
    weeks.filter(({ count }) => count > 0).map(({ runs }) => ({ year, runs }))
  );

  assertEquals(occupiedWeeks, [
    { year: 2021, runs: [run("2021-12-31T00:00:00.000Z", 1)] },
    { year: 2022, runs: [run("2022-01-01T00:00:00.000Z", 2)] },
  ]);
});
