import { assertEquals } from "@std/assert";
import { formatDelta, getGenderSymbol, runKey } from "./run-utils.ts";
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
