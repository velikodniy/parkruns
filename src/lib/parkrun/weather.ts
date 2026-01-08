// Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api

export interface Weather {
  temperatureC: number;
  weatherCode: number;
  windSpeedMs: number;
  windDirectionDeg: number;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

const PARKRUN_START_HOUR = 9;

export async function fetchWeather(
  latitude: number,
  longitude: number,
  dateYYYYMMDD: string,
): Promise<Weather | null> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", dateYYYYMMDD);
  url.searchParams.set("end_date", dateYYYYMMDD);
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
  );
  url.searchParams.set("wind_speed_unit", "ms");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Weather API error: ${response.status} for ${dateYYYYMMDD}`);
      return null;
    }

    const data: OpenMeteoResponse = await response.json();

    return {
      temperatureC: data.hourly.temperature_2m[PARKRUN_START_HOUR],
      weatherCode: data.hourly.weather_code[PARKRUN_START_HOUR],
      windSpeedMs: data.hourly.wind_speed_10m[PARKRUN_START_HOUR],
      windDirectionDeg: data.hourly.wind_direction_10m[PARKRUN_START_HOUR],
    };
  } catch (error) {
    console.error(`Failed to fetch weather for ${dateYYYYMMDD}:`, error);
    return null;
  }
}

export async function fetchWeatherForRuns(
  runs: Array<{
    eventId: number;
    eventDate: string;
    coordinates: [number, number] | null;
  }>,
  options: {
    delayMs?: number;
    concurrency?: number;
  } = {},
): Promise<Map<string, Weather | null>> {
  const { delayMs = 100, concurrency = 5 } = options;

  const uniqueRequests = new Map<
    string,
    { lat: number; lon: number; date: string }
  >();

  for (const run of runs) {
    if (!run.coordinates) continue;

    const [lat, lon] = run.coordinates;
    const date = run.eventDate.split("T")[0];
    const key = `${lat.toFixed(4)},${lon.toFixed(4)},${date}`;

    if (!uniqueRequests.has(key)) {
      uniqueRequests.set(key, { lat, lon, date });
    }
  }

  console.log(
    `Fetching weather for ${uniqueRequests.size} unique location/date combinations...`,
  );

  const results = new Map<string, Weather | null>();
  const requests = Array.from(uniqueRequests.entries());

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async ([key, { lat, lon, date }]) => {
        const weather = await fetchWeather(lat, lon, date);
        return [key, weather] as const;
      }),
    );

    for (const [key, weather] of batchResults) {
      results.set(key, weather);
    }

    const completed = Math.min(i + concurrency, requests.length);
    console.log(`  Weather progress: ${completed}/${requests.length}`);

    if (i + concurrency < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export function getWeatherKey(
  coordinates: [number, number],
  eventDate: string,
): string {
  const [lat, lon] = coordinates;
  const date = eventDate.split("T")[0];
  return `${lat.toFixed(4)},${lon.toFixed(4)},${date}`;
}
