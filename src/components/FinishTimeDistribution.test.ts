import { assertEquals } from "@std/assert";
import { summarizeFinishTimes } from "./FinishTimeDistribution.tsx";

Deno.test("finish time summary interpolates even-sized quantiles", () => {
  assertEquals(summarizeFinishTimes([1200, 1800]), {
    min: 1200,
    q1: 1350,
    median: 1500,
    q3: 1650,
    max: 1800,
    count: 2,
  });
});
