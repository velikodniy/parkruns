import { assertEquals } from "@std/assert";
import type { Run } from "../types.ts";
import { getFinishTimeDomain } from "./FinishTimeChart.tsx";

function run(finishTimeSeconds: number): Run {
  return {
    eventName: "Test",
    eventId: finishTimeSeconds,
    eventEdition: 1,
    eventDate: "2026-08-15T00:00:00.000Z",
    finishTime: "20:00",
    finishTimeSeconds,
    position: 1,
    totalFinishers: 100,
    genderPosition: 1,
    ageGrade: 70,
    ageCategory: "VM35-39",
    wasPb: false,
    wasFirstVisit: false,
  };
}

Deno.test("finish time domain includes slow outliers", () => {
  const domain = getFinishTimeDomain(
    [run(1200), run(1250), run(7200)],
    [],
  );

  assertEquals(domain, [1185, 7215]);
});
