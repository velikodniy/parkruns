import { assertEquals, assertNotEquals } from "@std/assert";
import {
  getWeatherKey,
  type OpenMeteoResponse,
  OpenMeteoResponseSchema,
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

Deno.test("weatherByDateAtHour - skips nullable observations", () => {
  const response = OpenMeteoResponseSchema.parse({
    hourly: {
      time: ["2026-05-09T08:00", "2026-05-10T08:00"],
      temperature_2m: [8, null],
      weather_code: [2, 3],
      wind_speed_10m: [4, 5],
      wind_direction_10m: [180, 190],
    },
  });

  assertEquals(
    weatherByDateAtHour(response, 8),
    new Map([["2026-05-09", {
      temperatureC: 8,
      weatherCode: 2,
      windSpeedMs: 4,
      windDirectionDeg: 180,
    }]]),
  );
});

Deno.test("OpenMeteoResponseSchema rejects mismatched hourly arrays", () => {
  const response = structuredClone(RESPONSE);
  response.hourly.weather_code.pop();

  assertEquals(OpenMeteoResponseSchema.safeParse(response).success, false);
});
