import { assertEquals } from "@std/assert";
import type { Run } from "./types.ts";
import { buildCalendarYearData } from "./calendar-data.ts";

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

function occupiedWeekKeys(runs: Run[]): string[] {
  return buildCalendarYearData(runs).flatMap(({ year, weeks }) =>
    weeks
      .filter(({ count }) => count > 0)
      .map(({ week, count }) => `${year}:${week.toISOString()}:${count}`)
  );
}

Deno.test("calendar data is empty when there are no runs", () => {
  assertEquals(buildCalendarYearData([]), []);
});

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

Deno.test("calendar week structure does not depend on run order", () => {
  const runs = [
    run("2021-01-01T00:00:00.000Z", 1),
    run("2022-06-18T00:00:00.000Z", 2),
    run("2023-12-30T00:00:00.000Z", 3),
  ];

  assertEquals(occupiedWeekKeys(runs), occupiedWeekKeys(runs.toReversed()));
});
