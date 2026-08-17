import { assertEquals, assertGreaterOrEqual } from "@std/assert";
import { fetchRegion, NOMINATIM_REQUEST_INTERVAL_MS } from "./regions.ts";

Deno.test("Nominatim requests stay within the recurring-script limit", () => {
  const minimumInterval = 60_000 / 4;
  assertGreaterOrEqual(NOMINATIM_REQUEST_INTERVAL_MS, minimumInterval);
});

Deno.test("fetchRegion leaves transient failures uncached", async () => {
  const region = await fetchRegion(
    [-0.1, 51.5],
    () => Promise.resolve(new Response(null, { status: 429 })),
  );

  assertEquals(region, null);
});
