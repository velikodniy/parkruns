// Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api

import { JsonCache } from "../cache.ts";
import { fetchWithRetry } from "../http.ts";
import type { LatLng } from "./types.ts";

const OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive";
const PARKRUN_START_HOUR = 9;

export interface Weather {
  temperatureC: number;
  weatherCode: number;
  windSpeedMs: number;
  windDirectionDeg: number;
}

function isWeather(value: unknown): value is Weather {
  if (typeof value !== "object" || value === null) return false;
  const weather = value as Record<string, unknown>;
  return typeof weather.temperatureC === "number" &&
    Number.isFinite(weather.temperatureC) &&
    typeof weather.weatherCode === "number" &&
    Number.isFinite(weather.weatherCode) &&
    typeof weather.windSpeedMs === "number" &&
    Number.isFinite(weather.windSpeedMs) &&
    typeof weather.windDirectionDeg === "number" &&
    Number.isFinite(weather.windDirectionDeg);
}

const cache = new JsonCache<Weather>("weather.json", { isValid: isWeather });

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

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

    const data: OpenMeteoResponse = await response.json();
    const weatherByDate = new Map<string, Weather>();

    for (let i = 0; i < data.hourly.time.length; i++) {
      const timestamp = data.hourly.time[i];
      const hour = new Date(timestamp).getHours();

      if (hour === PARKRUN_START_HOUR) {
        const date = timestamp.split("T")[0];
        weatherByDate.set(date, {
          temperatureC: data.hourly.temperature_2m[i],
          weatherCode: data.hourly.weather_code[i],
          windSpeedMs: data.hourly.wind_speed_10m[i],
          windDirectionDeg: data.hourly.wind_direction_10m[i],
        });
      }
    }

    return weatherByDate;
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
  runs: Array<{
    eventId: number;
    eventDate: string;
    coordinates: LatLng | null;
  }>,
): Promise<Map<string, Weather>> {
  const keys = runs
    .filter((r) => r.coordinates)
    .map((r) => getWeatherKey(r.coordinates!, r.eventDate));

  return cache.resolve(keys, async (missing) => {
    const locationGroups = groupKeysByLocation(missing);

    console.log(
      `Fetching weather for ${missing.length} runs across ${locationGroups.size} locations`,
    );

    const results = new Map<string, Weather>();
    const locations = [...locationGroups.entries()];

    for (let i = 0; i < locations.length; i++) {
      const [locKey, { latitude, longitude, dates }] = locations[i];
      const sortedDates = [...dates].sort();

      const weatherByDate = await fetchWeatherForLocation(
        latitude,
        longitude,
        sortedDates[0],
        sortedDates[sortedDates.length - 1],
      );

      for (const date of dates) {
        const weather = weatherByDate?.get(date);
        if (weather) results.set(`${locKey},${date}`, weather);
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
  return `${locationKey(latitude, longitude)},${date}`;
}
