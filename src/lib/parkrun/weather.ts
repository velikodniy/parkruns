// Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api

import { JsonCache } from "../cache.ts";
import { fetchWithRetry } from "../http.ts";
import { type Weather, WeatherSchema } from "../../types.ts";
import type { LatLng } from "./types.ts";
import { z } from "zod";

const OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive";
// Open-Meteo returns local timestamps because requests use `timezone=auto`.
const WEATHER_SAMPLE_HOUR = 9;

const cache = new JsonCache<Weather>("weather.json", {
  schema: WeatherSchema,
});

const LocalHourlyTimestampSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
  "Expected a local hourly timestamp",
);
const NullableObservationSchema = z.number().finite().nullable();
const OBSERVATION_FIELDS = [
  "temperature_2m",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
] as const;

export const OpenMeteoResponseSchema = z.object({
  hourly: z.object({
    time: z.array(LocalHourlyTimestampSchema),
    temperature_2m: z.array(NullableObservationSchema),
    weather_code: z.array(NullableObservationSchema),
    wind_speed_10m: z.array(NullableObservationSchema),
    wind_direction_10m: z.array(NullableObservationSchema),
  }),
}).superRefine((data, ctx) => {
  const expectedLength = data.hourly.time.length;
  for (const field of OBSERVATION_FIELDS) {
    const actualLength = data.hourly[field].length;
    if (actualLength !== expectedLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hourly", field],
        message:
          `Expected ${expectedLength} observations, received ${actualLength}`,
      });
    }
  }
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

function locationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<Map<string, Weather> | null> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
  );
  url.searchParams.set("wind_speed_unit", "ms");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      console.error(
        `Weather API error: ${response.status} for ${startDate}-${endDate}`,
      );
      return null;
    }

    const data = OpenMeteoResponseSchema.parse(await response.json());
    return weatherByDateAt9am(data);
  } catch (error) {
    console.error(
      `Failed to fetch weather for ${startDate}-${endDate}:`,
      error,
    );
    return null;
  }
}

interface LocationGroup {
  latitude: number;
  longitude: number;
  dates: Set<string>;
}

export interface WeatherRun {
  eventDate: string;
  coordinates: LatLng;
}

export function weatherByDateAt9am(
  data: OpenMeteoResponse,
): Map<string, Weather> {
  const weatherByDate = new Map<string, Weather>();

  for (let i = 0; i < data.hourly.time.length; i++) {
    const timestamp = data.hourly.time[i];
    const hour = Number(timestamp.slice(11, 13));

    if (hour === WEATHER_SAMPLE_HOUR) {
      const weather = WeatherSchema.safeParse({
        temperatureC: data.hourly.temperature_2m[i],
        weatherCode: data.hourly.weather_code[i],
        windSpeedMs: data.hourly.wind_speed_10m[i],
        windDirectionDeg: data.hourly.wind_direction_10m[i],
      });
      if (weather.success) {
        weatherByDate.set(timestamp.slice(0, 10), weather.data);
      }
    }
  }

  return weatherByDate;
}

function groupKeysByLocation(
  keys: string[],
): Map<string, LocationGroup> {
  const groups = new Map<string, LocationGroup>();

  for (const key of keys) {
    const [latitudeStr, longitudeStr, date] = key.split(",");
    const locKey = `${latitudeStr},${longitudeStr}`;
    const existing = groups.get(locKey);
    if (existing) {
      existing.dates.add(date);
    } else {
      groups.set(locKey, {
        latitude: Number(latitudeStr),
        longitude: Number(longitudeStr),
        dates: new Set([date]),
      });
    }
  }

  return groups;
}

export function fetchWeatherForRuns(
  runs: readonly WeatherRun[],
): Promise<Map<string, Weather>> {
  const keys = runs.map((run) => getWeatherKey(run.coordinates, run.eventDate));

  return cache.resolve(keys, async (missing) => {
    const locationGroups = groupKeysByLocation(missing);

    console.log(
      `Fetching weather for ${missing.length} runs across ${locationGroups.size} locations`,
    );

    const results = new Map<string, Weather>();
    const locations = [...locationGroups.entries()];

    for (let i = 0; i < locations.length; i++) {
      const [, { latitude, longitude, dates }] = locations[i];
      const sortedDates = [...dates].sort();

      const weatherByDate = await fetchWeatherForLocation(
        latitude,
        longitude,
        sortedDates[0],
        sortedDates[sortedDates.length - 1],
      );

      for (const date of dates) {
        const weather = weatherByDate?.get(date);
        if (weather) {
          results.set(
            getWeatherKey([latitude, longitude], date),
            weather,
          );
        }
      }

      console.log(
        `  Weather progress: ${i + 1}/${locations.length} locations`,
      );
    }

    return results;
  });
}

export function getWeatherKey(
  coordinates: LatLng,
  eventDate: string,
): string {
  const [latitude, longitude] = coordinates;
  const date = eventDate.split("T")[0];
  return `${locationKey(latitude, longitude)},${date},${WEATHER_SAMPLE_HOUR}`;
}
