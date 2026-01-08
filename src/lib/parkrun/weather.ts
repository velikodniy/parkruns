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

function locationKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<Map<string, Weather> | null> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
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
      console.error(`Weather API error: ${response.status} for ${startDate}-${endDate}`);
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
    console.error(`Failed to fetch weather for ${startDate}-${endDate}:`, error);
    return null;
  }
}

export async function fetchWeatherForRuns(
  runs: Array<{
    eventId: number;
    eventDate: string;
    coordinates: [number, number] | null;
  }>,
): Promise<Map<string, Weather | null>> {
  const locationGroups = new Map<
    string,
    { lat: number; lon: number; dates: Set<string> }
  >();

  for (const run of runs) {
    if (!run.coordinates) continue;

    const [lat, lon] = run.coordinates;
    const key = locationKey(lat, lon);
    const date = run.eventDate.split("T")[0];

    const existing = locationGroups.get(key);
    if (existing) {
      existing.dates.add(date);
    } else {
      locationGroups.set(key, { lat, lon, dates: new Set([date]) });
    }
  }

  const totalDates = Array.from(locationGroups.values()).reduce(
    (sum, g) => sum + g.dates.size,
    0,
  );
  console.log(
    `Fetching weather: ${totalDates} dates across ${locationGroups.size} locations (${locationGroups.size} API calls)`,
  );

  const results = new Map<string, Weather | null>();
  const locations = Array.from(locationGroups.entries());

  for (let i = 0; i < locations.length; i++) {
    const [locKey, { lat, lon, dates }] = locations[i];
    const sortedDates = Array.from(dates).sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    const weatherByDate = await fetchWeatherForLocation(lat, lon, startDate, endDate);

    for (const date of dates) {
      const key = `${locKey},${date}`;
      results.set(key, weatherByDate?.get(date) ?? null);
    }

    console.log(`  Weather progress: ${i + 1}/${locations.length} locations`);
  }

  return results;
}

export function getWeatherKey(
  coordinates: [number, number],
  eventDate: string,
): string {
  const [lat, lon] = coordinates;
  const date = eventDate.split("T")[0];
  return `${locationKey(lat, lon)},${date}`;
}
