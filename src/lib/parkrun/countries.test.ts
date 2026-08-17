import { assertEquals } from "@std/assert";
import { getUnvisitedEventCountryISOs } from "./countries.ts";

Deno.test("getUnvisitedEventCountryISOs returns countries without a visit", () => {
  assertEquals(
    getUnvisitedEventCountryISOs(
      ["au", "gb", "us"],
      ["gb-eng", "gb-sct", "us"],
    ),
    ["au"],
  );
});
