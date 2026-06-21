import { assertEquals } from "@std/assert";
import {
  computeAllTimePBs,
  formatDelta,
  getGenderSymbol,
  runKey,
} from "./run-utils.ts";
import type { Run } from "../types.ts";

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

// === formatDelta ===

Deno.test("formatDelta - returns null when there is no previous run", () => {
  assertEquals(formatDelta(65.0, null), null);
});

Deno.test("formatDelta - improvement is a green up-arrow with a + sign", () => {
  assertEquals(formatDelta(67.3, 65.0), { text: "↑ +2.3%", color: "green" });
});

Deno.test("formatDelta - decline is a red down-arrow carrying the minus sign", () => {
  assertEquals(formatDelta(63.0, 65.5), { text: "↓ -2.5%", color: "red" });
});

Deno.test("formatDelta - no change is a neutral dimmed arrow, not a red drop", () => {
  assertEquals(formatDelta(65.0, 65.0), { text: "→ 0.0%", color: "dimmed" });
});

Deno.test("formatDelta - a sub-0.05 change reads as flat (arrow matches digits)", () => {
  // Raw delta is +0.04 but rounds to 0.0%, so it must render as flat, not green.
  assertEquals(formatDelta(65.04, 65.0), { text: "→ 0.0%", color: "dimmed" });
});

// === getGenderSymbol ===

Deno.test("getGenderSymbol - veteran and senior categories use the 2nd char", () => {
  assertEquals(getGenderSymbol("VM35-39"), "♂");
  assertEquals(getGenderSymbol("VW35-39"), "♀");
  assertEquals(getGenderSymbol("SM30-34"), "♂");
  assertEquals(getGenderSymbol("SW30-34"), "♀");
});

Deno.test("getGenderSymbol - junior categories fall back to the JM check", () => {
  assertEquals(getGenderSymbol("JM11-14"), "♂");
  assertEquals(getGenderSymbol("JW11-14"), "♀");
});

// === runKey ===

Deno.test("runKey - combines event date and id so re-runs of an event differ", () => {
  const run = createMockRun({ eventDate: "2024-03-10T09:00:00Z", eventId: 42 });
  assertEquals(runKey(run), "2024-03-10T09:00:00Z-42");
});

// === computeAllTimePBs ===

Deno.test("computeAllTimePBs - marks each run that beat all earlier runs", () => {
  // Newest-first ordering (as the app stores runs). Walking oldest -> newest:
  // 1300 (PB), 1200 (PB), 1000 (PB), 1100 (not a PB).
  const newest = createMockRun({
    finishTimeSeconds: 1100,
    eventDate: "2024-04-01T09:00:00Z",
    eventId: 4,
  });
  const best = createMockRun({
    finishTimeSeconds: 1000,
    eventDate: "2024-03-01T09:00:00Z",
    eventId: 3,
  });
  const mid = createMockRun({
    finishTimeSeconds: 1200,
    eventDate: "2024-02-01T09:00:00Z",
    eventId: 2,
  });
  const oldest = createMockRun({
    finishTimeSeconds: 1300,
    eventDate: "2024-01-01T09:00:00Z",
    eventId: 1,
  });
  const runs = [newest, best, mid, oldest];

  const pbs = computeAllTimePBs(runs);

  assertEquals(pbs.size, 3);
  assertEquals(pbs.has(runKey(oldest)), true);
  assertEquals(pbs.has(runKey(mid)), true);
  assertEquals(pbs.has(runKey(best)), true);
  // The latest run was slower than the all-time best, so it is not a PB.
  assertEquals(pbs.has(runKey(newest)), false);
});

Deno.test("computeAllTimePBs - handles an empty history", () => {
  assertEquals(computeAllTimePBs([]).size, 0);
});
