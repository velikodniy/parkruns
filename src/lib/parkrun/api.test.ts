import { assertEquals, assertThrows } from "@std/assert";
import { parseRunStatsResponse, requireTotalFinishers } from "./api.ts";

Deno.test("parseRunStatsResponse validates and indexes run summaries", () => {
  const stats = parseRunStatsResponse({
    data: {
      Runs: [{
        EventNumber: "12",
        EventDate: "2026-08-15",
        NumberRunners: "345",
        abstractId: "678",
      }],
    },
  });

  assertEquals(stats, new Map([["12-678", 345]]));
});

Deno.test("parseRunStatsResponse rejects a missing Runs array", () => {
  assertThrows(
    () => parseRunStatsResponse({ data: {} }),
    Error,
    "missing data.Runs",
  );
});

Deno.test("parseRunStatsResponse rejects invalid finisher totals", () => {
  assertThrows(
    () =>
      parseRunStatsResponse({
        data: {
          Runs: [{
            EventNumber: "12",
            EventDate: "2026-08-15",
            NumberRunners: "unknown",
            abstractId: "678",
          }],
        },
      }),
    Error,
    "invalid NumberRunners",
  );
});

Deno.test("requireTotalFinishers rejects a missing run summary", () => {
  assertThrows(
    () => requireTotalFinishers(new Map(), "12-678"),
    Error,
    "Missing run summary for event 12-678",
  );
});
