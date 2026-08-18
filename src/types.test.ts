import { assertEquals } from "@std/assert";
import { RunSchema, WeatherSchema } from "./types.ts";

const validRun = {
  eventName: "Test parkrun",
  eventId: 1,
  eventEdition: 1,
  eventDate: "2026-08-15T00:00:00.000Z",
  finishTime: "20:00",
  finishTimeSeconds: 1200,
  position: 1,
  totalFinishers: 100,
  genderPosition: 1,
  ageGrade: 65,
  ageCategory: "VM35-39",
  wasPb: false,
  wasFirstVisit: false,
};

Deno.test("RunSchema accepts record-setting age grades above 100%", () => {
  assertEquals(
    RunSchema.safeParse({ ...validRun, ageGrade: 101.1 }).success,
    true,
  );
});

Deno.test("RunSchema still rejects negative age grades", () => {
  assertEquals(
    RunSchema.safeParse({ ...validRun, ageGrade: -0.1 }).success,
    false,
  );
});

Deno.test("WeatherSchema rejects non-finite observations", () => {
  assertEquals(
    WeatherSchema.safeParse({
      temperatureC: Number.POSITIVE_INFINITY,
      weatherCode: 1,
      windSpeedMs: 2,
      windDirectionDeg: 180,
    }).success,
    false,
  );
});
