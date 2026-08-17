import { assertGreaterOrEqual } from "@std/assert";
import { NOMINATIM_REQUEST_INTERVAL_MS } from "./regions.ts";

Deno.test("Nominatim requests stay within the recurring-script limit", () => {
  const minimumInterval = 60_000 / 4;
  assertGreaterOrEqual(NOMINATIM_REQUEST_INTERVAL_MS, minimumInterval);
});
