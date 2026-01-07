import { assertEquals } from "jsr:@std/assert";
import { computeRunStats, sortRunsByDateDesc } from "./stats.ts";
import type { Run } from "./types.ts";

function createMockRun(overrides: Partial<Run> = {}): Run {
  return {
    eventName: "Test parkrun",
    eventId: 1,
    eventEdition: 1,
    eventDate: "2024-01-01T09:00:00Z",
    finishTime: "20:00",
    finishTimeSeconds: 1200,
    position: 10,
    totalFinishers: 100,
    genderPosition: 5,
    ageGrade: 65.0,
    ageCategory: "VM35-39",
    wasPb: false,
    wasFirstVisit: false,
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



Deno.test("computeRunStats - finds fastest time", () => {
  const runs = [
    createMockRun({ finishTimeSeconds: 1500 }),
    createMockRun({ finishTimeSeconds: 1200 }),
    createMockRun({ finishTimeSeconds: 1350 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.fastestTime, 1200);
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

// === recentMedianTime tests ===

Deno.test("computeRunStats - calculates 5-run median with odd count", () => {
  // Runs sorted desc by date (most recent first)
  const runs = [
    createMockRun({ finishTimeSeconds: 1100, eventDate: "2024-05-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1300, eventDate: "2024-04-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1000, eventDate: "2024-03-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1400, eventDate: "2024-02-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1200, eventDate: "2024-01-01T09:00:00Z" }),
  ];
  const sorted = sortRunsByDateDesc(runs);
  const stats = computeRunStats(sorted);
  // sorted times: 1000, 1100, 1200, 1300, 1400 → median = 1200
  assertEquals(stats.recentMedianTime, 1200);
});

Deno.test("computeRunStats - calculates 5-run median with even count (2 runs)", () => {
  const runs = [
    createMockRun({ finishTimeSeconds: 1200, eventDate: "2024-02-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1400, eventDate: "2024-01-01T09:00:00Z" }),
  ];
  const sorted = sortRunsByDateDesc(runs);
  const stats = computeRunStats(sorted);
  // (1200 + 1400) / 2 = 1300
  assertEquals(stats.recentMedianTime, 1300);
});

Deno.test("computeRunStats - uses only most recent 5 runs for median", () => {
  const runs = [
    createMockRun({ finishTimeSeconds: 1000, eventDate: "2024-06-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1100, eventDate: "2024-05-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1200, eventDate: "2024-04-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1300, eventDate: "2024-03-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 1400, eventDate: "2024-02-01T09:00:00Z" }),
    createMockRun({ finishTimeSeconds: 2000, eventDate: "2024-01-01T09:00:00Z" }), // ignored
  ];
  const sorted = sortRunsByDateDesc(runs);
  const stats = computeRunStats(sorted);
  // Only first 5: 1000, 1100, 1200, 1300, 1400 → median = 1200 (2000 excluded)
  assertEquals(stats.recentMedianTime, 1200);
});

Deno.test("computeRunStats - handles single run for median", () => {
  const runs = [createMockRun({ finishTimeSeconds: 1500 })];
  const stats = computeRunStats(runs);
  assertEquals(stats.recentMedianTime, 1500);
});

Deno.test("computeRunStats - calculates best top percent", () => {
  const runs = [
    createMockRun({ position: 50, totalFinishers: 200 }),
    createMockRun({ position: 10, totalFinishers: 100 }),
    createMockRun({ position: 30, totalFinishers: 150 }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.bestTopPercent, 10);
  assertEquals(stats.bestTopPercentRun, { position: 10, totalFinishers: 100 });
});

Deno.test("computeRunStats - bestTopPercent handles first place", () => {
  const runs = [createMockRun({ position: 1, totalFinishers: 500 })];
  const stats = computeRunStats(runs);
  assertEquals(stats.bestTopPercent, 0.2);
});

Deno.test("computeRunStats - captures age category with best age grade", () => {
  const runs = [
    createMockRun({ ageGrade: 55.5, ageCategory: "VM35-39" }),
    createMockRun({ ageGrade: 72.3, ageCategory: "VM40-44" }),
    createMockRun({ ageGrade: 68.1, ageCategory: "VM45-49" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.bestAgeGrade, 72.3);
  assertEquals(stats.bestAgeGradeCategory, "VM40-44");
});

Deno.test("computeRunStats - streak counts consecutive weeks", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-20T09:00:00Z" }),
    createMockRun({ eventDate: "2024-01-13T09:00:00Z" }),
    createMockRun({ eventDate: "2024-01-06T09:00:00Z" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.streak.best, 3);
});

Deno.test("computeRunStats - streak breaks on gap week", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-20T09:00:00Z" }),
    createMockRun({ eventDate: "2024-01-06T09:00:00Z" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.streak.best, 1);
});

Deno.test("computeRunStats - streak handles year boundary", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-06T09:00:00Z" }),
    createMockRun({ eventDate: "2023-12-30T09:00:00Z" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.streak.best, 2);
});

Deno.test("computeRunStats - multiple runs same week count as 1", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-08T09:00:00Z" }),
    createMockRun({ eventDate: "2024-01-09T09:00:00Z" }),
  ];
  const stats = computeRunStats(runs);
  assertEquals(stats.streak.best, 1);
});

Deno.test("sortRunsByDateDesc - handles empty array", () => {
  const sorted = sortRunsByDateDesc([]);
  assertEquals(sorted, []);
});

Deno.test("sortRunsByDateDesc - handles single run", () => {
  const runs = [createMockRun({ eventDate: "2024-01-01T09:00:00Z" })];
  const sorted = sortRunsByDateDesc(runs);
  assertEquals(sorted.length, 1);
});

Deno.test("sortRunsByDateDesc - handles same dates", () => {
  const runs = [
    createMockRun({ eventDate: "2024-01-01T09:00:00Z", eventName: "A" }),
    createMockRun({ eventDate: "2024-01-01T09:00:00Z", eventName: "B" }),
  ];
  const sorted = sortRunsByDateDesc(runs);
  assertEquals(sorted.length, 2);
});

Deno.test("computeRunStats - handles empty array", () => {
  const stats = computeRunStats([]);
  assertEquals(stats.totalRuns, 0);
  assertEquals(stats.fastestTime, Number.POSITIVE_INFINITY);
  assertEquals(stats.bestAgeGrade, 0);
  assertEquals(stats.uniqueEvents, 0);
  assertEquals(stats.streak, { current: 0, best: 0 });
});
