import { assertEquals } from "@std/assert";
import {
  clusterDates,
  getWeatherKey,
  type OpenMeteoResponse,
  OpenMeteoResponseSchema,
  parseWeatherKey,
  weatherByDateAt9am,
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

Deno.test("getWeatherKey - identifies the 9am sample by location and date", () => {
  const coordinates: [number, number] = [51.5, -0.1];
  assertEquals(
    getWeatherKey(coordinates, "2026-05-09T00:00:00.000Z"),
    "51.5000,-0.1000,2026-05-09,9",
  );
});

Deno.test("parseWeatherKey - parses valid weather keys", () => {
  assertEquals(parseWeatherKey("51.5000,-0.1000,2026-05-09,9"), {
    latitude: 51.5,
    longitude: -0.1,
    date: "2026-05-09",
    hour: 9,
  });
  assertEquals(parseWeatherKey("invalid"), null);
});

Deno.test("clusterDates - groups nearby dates and separates distant dates", () => {
  assertEquals(clusterDates([]), []);
  assertEquals(clusterDates(["2024-01-01"]), [["2024-01-01"]]);
  assertEquals(
    clusterDates([
      "2024-01-01",
      "2024-01-08",
      "2024-01-15",
      "2024-06-01",
      "2024-06-08",
    ]),
    [
      ["2024-01-01", "2024-01-08", "2024-01-15"],
      ["2024-06-01", "2024-06-08"],
    ],
  );
});

Deno.test("weatherByDateAt9am - selects 9am local time", () => {
  assertEquals(weatherByDateAt9am(RESPONSE).get("2026-05-09"), {
    temperatureC: 9,
    weatherCode: 3,
    windSpeedMs: 5,
    windDirectionDeg: 190,
  });
});

Deno.test("weatherByDateAt9am - skips nullable observations", () => {
  const response = OpenMeteoResponseSchema.parse({
    hourly: {
      time: ["2026-05-09T09:00", "2026-05-10T09:00"],
      temperature_2m: [8, null],
      weather_code: [2, 3],
      wind_speed_10m: [4, 5],
      wind_direction_10m: [180, 190],
    },
  });

  assertEquals(
    weatherByDateAt9am(response),
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
