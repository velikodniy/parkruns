import { assertEquals } from "@std/assert";
import type { Run } from "../types.ts";
import { getAgeGradeDomain } from "./AgeGradeChart.tsx";

const run = {
  eventName: "Test parkrun",
  eventId: 1,
  eventEdition: 1,
  eventDate: "2026-08-15T00:00:00.000Z",
  finishTime: "20:00",
  finishTimeSeconds: 1200,
  position: 1,
  totalFinishers: 100,
  genderPosition: 1,
  ageGrade: 101.1,
  ageCategory: "VM35-39",
  wasPb: false,
  wasFirstVisit: false,
} satisfies Run;

Deno.test("age grade domain includes scores above 100%", () => {
  assertEquals(getAgeGradeDomain([run]), [35, 106.1]);
});
