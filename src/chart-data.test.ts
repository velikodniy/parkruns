import { assertEquals } from "@std/assert";
import {
  buildAgeGradeChartData,
  buildFinishTimeChartData,
  buildMonthlyFinishTimeData,
  getFinishTimeDomain,
  summarizeFinishTimes,
} from "./chart-data.ts";
import type { Run } from "./types.ts";

function run(
  finishTimeSeconds: number,
  eventDate = "2026-08-15T00:00:00.000Z",
  ageGrade = 70,
): Run {
  return {
    eventName: "Test",
    eventId: finishTimeSeconds,
    eventEdition: 1,
    eventDate,
    finishTime: "20:00",
    finishTimeSeconds,
    position: 1,
    totalFinishers: 100,
    genderPosition: 1,
    ageGrade,
    ageCategory: "VM35-39",
    wasPb: false,
    wasFirstVisit: false,
  };
}

Deno.test("age grade chart data sorts runs and includes scores above 100%", () => {
  const later = run(1200, "2026-08-15T00:00:00.000Z", 101.1);
  const earlier = run(1210, "2026-08-08T00:00:00.000Z", 70);

  const data = buildAgeGradeChartData([later, earlier]);

  assertEquals(data.runs, [earlier, later]);
  assertEquals(data.domain, [35, 106.1]);
});

Deno.test("finish time domain includes slow outliers", () => {
  const domain = getFinishTimeDomain(
    [run(1200), run(1250), run(7200)],
    [],
  );

  assertEquals(domain, [1185, 7215]);
});

Deno.test("finish time chart keeps recent runs but derives medals from all runs", () => {
  const runs = Array.from({ length: 26 }, (_, index) =>
    run(
      1300 + index,
      new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    ));
  runs[0] = run(1100, runs[0].eventDate);

  const data = buildFinishTimeChartData(runs.reverse());

  assertEquals(data.visibleRuns.length, 25);
  assertEquals(data.visibleRuns[0].eventDate, "2026-01-02T00:00:00.000Z");
  assertEquals(data.topFinishes[0].finishTimeSeconds, 1100);
  assertEquals(data.domain[0], 1085);
  assertEquals(data.rollingMedian?.length, 25);
});

Deno.test("finish time summary sorts a copy before calculating quantiles", () => {
  const times = [1800, 1200];

  assertEquals(summarizeFinishTimes(times), {
    min: 1200,
    q1: 1350,
    median: 1500,
    q3: 1650,
    max: 1800,
    count: 2,
  });
  assertEquals(times, [1800, 1200]);
});

Deno.test("monthly finish time data groups and sorts unsorted runs", () => {
  assertEquals(
    buildMonthlyFinishTimeData([
      run(1800, "2026-02-14T00:00:00.000Z"),
      run(1200, "2026-01-10T00:00:00.000Z"),
      run(1600, "2026-02-07T00:00:00.000Z"),
    ]),
    [
      {
        month: "2026-01",
        min: 1200,
        q1: 1200,
        median: 1200,
        q3: 1200,
        max: 1200,
        count: 1,
      },
      {
        month: "2026-02",
        min: 1600,
        q1: 1650,
        median: 1700,
        q3: 1750,
        max: 1800,
        count: 2,
      },
    ],
  );
});
