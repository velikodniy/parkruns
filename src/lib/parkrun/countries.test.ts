import { assertEquals } from "@std/assert";
import { getUnvisitedEventCountryISOs, isGbRegion } from "./countries.ts";

Deno.test("isGbRegion identifies GB regions and Crown dependencies", () => {
  assertEquals(isGbRegion("gb-eng"), true);
  assertEquals(isGbRegion("gb-sct"), true);
  assertEquals(isGbRegion("je"), true);
  assertEquals(isGbRegion("im"), true);
  assertEquals(isGbRegion("au"), false);
  assertEquals(isGbRegion("unknown"), false);
});

Deno.test("getUnvisitedEventCountryISOs returns countries without a visit", () => {
  assertEquals(
    getUnvisitedEventCountryISOs(
      ["au", "gb", "us"],
      ["gb-eng", "gb-sct", "us"],
    ),
    ["au"],
  );
});

Deno.test("getUnvisitedEventCountryISOs does not map unknown countries to gb", () => {
  assertEquals(
    getUnvisitedEventCountryISOs(
      ["au", "gb", "us"],
      ["unknown-country", "us"],
    ),
    ["au", "gb"],
  );
});

Deno.test("getUnvisitedEventCountryISOs handles Crown dependencies", () => {
  assertEquals(
    getUnvisitedEventCountryISOs(
      ["au", "gb", "us"],
      ["je", "us"],
    ),
    ["au"],
  );
});
