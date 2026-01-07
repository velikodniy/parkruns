import { assertEquals } from "jsr:@std/assert";
import { formatPace, formatTime } from "./format.ts";

Deno.test("formatTime - formats seconds correctly", () => {
  assertEquals(formatTime(1200), "20:00");
  assertEquals(formatTime(1344), "22:24");
  assertEquals(formatTime(3661), "1:01:01");
});

Deno.test("formatTime - handles edge cases", () => {
  assertEquals(formatTime(0), "0:00");
  assertEquals(formatTime(59), "0:59");
  assertEquals(formatTime(60), "1:00");
  assertEquals(formatTime(3600), "1:00:00");
});

Deno.test("formatPace - formats pace correctly", () => {
  assertEquals(formatPace(1200), "4:00/km");
  assertEquals(formatPace(1500), "5:00/km");
  assertEquals(formatPace(1800), "6:00/km");
});

Deno.test("formatPace - handles rounding without producing m:60", () => {
  // This was a bug: 239.6 seconds would produce 3:60 instead of 4:00
  assertEquals(formatPace(1198), "4:00/km"); // rounds to 240
  assertEquals(formatPace(1199), "4:00/km");
  assertEquals(formatPace(1201), "4:00/km");
});

Deno.test("formatPace - custom distance", () => {
  assertEquals(formatPace(600, 2), "5:00/km");
  assertEquals(formatPace(3000, 10), "5:00/km");
});
