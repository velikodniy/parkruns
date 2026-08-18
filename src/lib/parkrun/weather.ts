// Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api

import { JsonCache } from "../cache.ts";
import { fetchWithRetry } from "../http.ts";
import { type Weather, WeatherSchema } from "../../types.ts";
import type { LatLng } from "./types.ts";

const OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive";

const cache = new JsonCache<Weather>("weather.json", {
  schema: WeatherSchema,
});

export interface OpenMeteoResponse {
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
  weatherHour: number,
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
    return weatherByDateAtHour(data, weatherHour);
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
  weatherHour: number;
  dates: Set<string>;
}

export interface WeatherRun {
  eventDate: string;
  coordinates: LatLng;
  weatherHour: number;
}

export function weatherByDateAtHour(
  data: OpenMeteoResponse,
  weatherHour: number,
): Map<string, Weather> {
  const weatherByDate = new Map<string, Weather>();

  for (let i = 0; i < data.hourly.time.length; i++) {
    const timestamp = data.hourly.time[i];
    const hour = Number(timestamp.slice(11, 13));

    if (hour === weatherHour) {
      weatherByDate.set(timestamp.slice(0, 10), {
        temperatureC: data.hourly.temperature_2m[i],
        weatherCode: data.hourly.weather_code[i],
        windSpeedMs: data.hourly.wind_speed_10m[i],
        windDirectionDeg: data.hourly.wind_direction_10m[i],
      });
    }
  }

  return weatherByDate;
}

function groupKeysByLocation(
  keys: string[],
): Map<string, LocationGroup> {
  const groups = new Map<string, LocationGroup>();

  for (const key of keys) {
    const [latitudeStr, longitudeStr, date, weatherHourStr] = key.split(",");
    const weatherHour = Number(weatherHourStr);
    const locKey = `${latitudeStr},${longitudeStr},${weatherHour}`;
    const existing = groups.get(locKey);
    if (existing) {
      existing.dates.add(date);
    } else {
      groups.set(locKey, {
        latitude: Number(latitudeStr),
        longitude: Number(longitudeStr),
        weatherHour,
        dates: new Set([date]),
      });
    }
  }

  return groups;
}

export function fetchWeatherForRuns(
  runs: readonly WeatherRun[],
): Promise<Map<string, Weather>> {
  const keys = runs.map((run) =>
    getWeatherKey(run.coordinates, run.eventDate, run.weatherHour)
  );

  return cache.resolve(keys, async (missing) => {
    const locationGroups = groupKeysByLocation(missing);

    console.log(
      `Fetching weather for ${missing.length} runs across ${locationGroups.size} location/start-time groups`,
    );

    const results = new Map<string, Weather>();
    const locations = [...locationGroups.entries()];

    for (let i = 0; i < locations.length; i++) {
      const [, { latitude, longitude, weatherHour, dates }] = locations[i];
      const sortedDates = [...dates].sort();

      const weatherByDate = await fetchWeatherForLocation(
        latitude,
        longitude,
        sortedDates[0],
        sortedDates[sortedDates.length - 1],
        weatherHour,
      );

      for (const date of dates) {
        const weather = weatherByDate?.get(date);
        if (weather) {
          results.set(
            getWeatherKey([latitude, longitude], date, weatherHour),
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
  weatherHour: number,
): string {
  const [latitude, longitude] = coordinates;
  const date = eventDate.split("T")[0];
  return `${locationKey(latitude, longitude)},${date},${weatherHour}`;
}
