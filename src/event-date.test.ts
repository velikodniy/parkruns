import { assertEquals } from "@std/assert";
import {
  eventDateToDate,
  eventDateToISOString,
  eventMonthKey,
  formatEventDate,
  formatEventWeekday,
} from "./event-date.ts";

Deno.test("event dates retain their calendar day in every viewer timezone", () => {
  const eventDate = "2026-08-15T00:00:00.000Z";

  assertEquals(eventDateToDate(eventDate).toISOString(), eventDate);
  assertEquals(eventDateToISOString("2026-08-15"), eventDate);
  assertEquals(formatEventDate(eventDate, "en-GB"), "15/08/2026");
  assertEquals(formatEventWeekday(eventDate), "Sat");
  assertEquals(eventMonthKey(eventDate), "2026-08");
});
