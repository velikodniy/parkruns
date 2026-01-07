import { assertEquals } from "jsr:@std/assert";
import { computeRunStats, sortRunsByDateDesc } from "./stats.ts";
import type { Run } from "./types.ts";

function createMockRun(overrides: Partial<Run> = {}): Run {
  return {
    eventName: "Test parkrun",
    eventId: 1,
    eventDate: "2024-01-01T09:00:00Z",
    finishTime: "20:00",
    finishTimeSeconds: 1200,
    position: 10,
    genderPosition: 5,
    ageGrade: 65.0,
    ageCategory: "VM35-39",
    wasPB: false,
    runNumber: 1,
    ...overrides,
  };
}

Deno.test("sortRunsByDateDesc - sorts runs by date descending", () => {
  const runs: Run[] = [
    createMockRun({ eventDate: "2024-01-01T09:00:00Z" }),
    createMockRun({ eventDate: "2024-06-15T09:00:00Z" }),
    createMockRun({ eventDate: "2024-03-10T09:00:00Z" }),
  ];

  const sorted = sortRunsByDateDesc(runs);

  assertEquals(sorted[0].eventDate, "2024-06-15T09:00:00Z");
  assertEquals(sorted[1].eventDate, "2024-03-10T09:00:00Z");
  assertEquals(sorted[2].eventDate, "2024-01-01T09:00:00Z");
});

Deno.test("sortRunsByDateDesc - does not mutate original array", () => {
  const runs: Run[] = [
    createMockRun({ eventDate: "2024-01-01T09:00:00Z" }),
    createMockRun({ eventDate: "2024-06-15T09:00:00Z" }),
  ];

  const sorted = sortRunsByDateDesc(runs);

  assertEquals(runs[0].eventDate, "2024-01-01T09:00:00Z");
  assertEquals(sorted !== runs, true);
});

Deno.test("computeRunStats - calculates total runs", () => {
  const runs = [createMockRun(), createMockRun(), createMockRun()];
  const stats = computeRunStats(runs);
  assertEquals(stats.totalRuns, 3);
});

Deno.test("computeRunStats - counts PBs correctly", () => {
  const runs = [
    createMockRun({ wasPB: true }),
    createMockRun({ wasPB: false }),
    createMockRun({ wasPB: true }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.pbCount, 2);
});

Deno.test("computeRunStats - finds fastest time", () => {
  const runs = [
    createMockRun({ finishTimeSeconds: 1500 }),
    createMockRun({ finishTimeSeconds: 1200 }),
    createMockRun({ finishTimeSeconds: 1350 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.fastestTime, 1200);
});

Deno.test("computeRunStats - calculates average time", () => {
  const runs = [
    createMockRun({ finishTimeSeconds: 1200 }),
    createMockRun({ finishTimeSeconds: 1400 }),
    createMockRun({ finishTimeSeconds: 1300 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.averageTime, 1300);
});

Deno.test("computeRunStats - finds best age grade", () => {
  const runs = [
    createMockRun({ ageGrade: 55.5 }),
    createMockRun({ ageGrade: 72.3 }),
    createMockRun({ ageGrade: 68.1 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.bestAgeGrade, 72.3);
});

Deno.test("computeRunStats - finds best position", () => {
  const runs = [
    createMockRun({ position: 50 }),
    createMockRun({ position: 12 }),
    createMockRun({ position: 25 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.bestPosition, 12);
});

Deno.test("computeRunStats - finds latest run date", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-01T09:00:00Z" }),
    createMockRun({ eventDate: "2024-12-15T09:00:00Z" }),
    createMockRun({ eventDate: "2024-06-20T09:00:00Z" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.latestRunDate.toISOString().slice(0, 10), "2024-12-15");
});

Deno.test("computeRunStats - counts unique events", () => {
  const runs = [
    createMockRun({ eventName: "Brighton" }),
    createMockRun({ eventName: "Hove Promenade" }),
    createMockRun({ eventName: "Brighton" }),
    createMockRun({ eventName: "Worthing" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.uniqueEvents, 3);
});
