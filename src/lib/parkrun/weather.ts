// Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api

import { JsonCache } from "../cache.ts";

const cache = new JsonCache<Weather | null>("weather.json");
const OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive";
const PARKRUN_START_HOUR = 9;

export interface Weather {
  temperatureC: number;
  weatherCode: number;
  windSpeedMs: number;
  windDirectionDeg: number;
}

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
    const response = await fetch(url);
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

export function fetchWeatherForRuns(
  runs: Array<{
    eventId: number;
    eventDate: string;
    coordinates: [number, number] | null;
  }>,
): Promise<Map<string, Weather | null>> {
  const keys = runs
    .filter((r) => r.coordinates)
    .map((r) => getWeatherKey(r.coordinates!, r.eventDate));

  return cache.resolve(keys, async (missing) => {
    const locationGroups = new Map<
      string,
      { latitude: number; longitude: number; dates: Set<string> }
    >();

    for (const key of missing) {
      const [latitudeStr, longitudeStr, date] = key.split(",");
      const locKey = `${latitudeStr},${longitudeStr}`;
      const existing = locationGroups.get(locKey);
      if (existing) {
        existing.dates.add(date);
      } else {
        locationGroups.set(locKey, {
          latitude: Number(latitudeStr),
          longitude: Number(longitudeStr),
          dates: new Set([date]),
        });
      }
    }

    console.log(
      `Fetching weather for ${missing.length} runs across ${locationGroups.size} locations`,
    );

    const results = new Map<string, Weather | null>();
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
        results.set(`${locKey},${date}`, weatherByDate?.get(date) ?? null);
      }

      console.log(
        `  Weather progress: ${i + 1}/${locations.length} locations`,
      );
    }

    return results;
  });
}

export function getWeatherKey(
  coordinates: [number, number],
  eventDate: string,
): string {
  const [latitude, longitude] = coordinates;
  const date = eventDate.split("T")[0];
  return `${locationKey(latitude, longitude)},${date}`;
}
