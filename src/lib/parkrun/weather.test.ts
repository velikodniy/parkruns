import { assertEquals, assertNotEquals } from "@std/assert";
import {
  getWeatherKey,
  type OpenMeteoResponse,
  weatherByDateAtHour,
} from "./weather.ts";

const RESPONSE: OpenMeteoResponse = {
  hourly: {
    time: ["2026-05-09T08:00", "2026-05-09T09:00"],
    temperature_2m: [8, 9],
    weather_code: [2, 3],
    wind_speed_10m: [4, 5],
    wind_direction_10m: [180, 190],
  },
};

Deno.test("getWeatherKey - distinguishes different event start hours", () => {
  const coordinates: [number, number] = [51.5, -0.1];
  const atEight = getWeatherKey(coordinates, "2026-05-09T00:00:00.000Z", 8);
  const atNine = getWeatherKey(coordinates, "2026-05-09T00:00:00.000Z", 9);

  assertNotEquals(atEight, atNine);
});

Deno.test("weatherByDateAtHour - selects the local requested hour", () => {
  assertEquals(weatherByDateAtHour(RESPONSE, 8).get("2026-05-09"), {
    temperatureC: 8,
    weatherCode: 2,
    windSpeedMs: 4,
    windDirectionDeg: 180,
  });
});
