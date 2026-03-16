import "@std/dotenv/load";
import { authenticate, getAthlete, getRuns } from "../src/lib/parkrun/api.ts";
import {
  getEventCoordinates,
  getEventCountryISO,
  getEventResultsUrl,
  getEventShortName,
  getEventUrl,
  getShortNameByLongName,
} from "../src/lib/parkrun/index.ts";
import {
  fetchWeatherForRuns,
  getWeatherKey,
  type Weather,
} from "../src/lib/parkrun/weather.ts";
import type { Profile } from "../src/types.ts";

const CACHE_PATH = ".cache/weather.json";
const CACHE_DIR = CACHE_PATH.replace(/\/[^/]+$/, "");

async function readWeatherCache(): Promise<Map<string, Weather | null>> {
  try {
    const text = await Deno.readTextFile(CACHE_PATH);
    return new Map(Object.entries(JSON.parse(text)));
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
    return new Map();
  }
}

async function writeWeatherCache(
  weather: Map<string, Weather | null>,
): Promise<void> {
  await Deno.mkdir(CACHE_DIR, { recursive: true });
  const obj = Object.fromEntries(weather);
  await Deno.writeTextFile(CACHE_PATH, JSON.stringify(obj, null, 2) + "\n");
}

const ATHLETE_ID = Deno.env.get("PARKRUN_ATHLETE_ID");
const PASSWORD = Deno.env.get("PARKRUN_PASSWORD");

if (!ATHLETE_ID || !PASSWORD) {
  console.error(
    "PARKRUN_ATHLETE_ID and PARKRUN_PASSWORD environment variables are required",
  );
  Deno.exit(1);
}

function capitalize(str: string): string {
  return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

async function downloadData(
  athleteId: string,
  password: string,
): Promise<void> {
  console.log(`Authenticating as ${athleteId}...`);
  const accessToken = await authenticate(athleteId, password);

  const numericId = Number.parseInt(athleteId.replace(/^A/i, ""));
  console.log(`Fetching athlete ${numericId}...`);
  const athlete = await getAthlete(accessToken, numericId);

  console.log("Fetching runs...");
  const runs = await getRuns(accessToken, numericId);

  const runsWithCoordinates = runs.map((run) => ({
    ...run,
    coordinates: getEventCoordinates(run.eventId),
  }));

  console.log("Fetching weather data...");
  const cachedWeather = await readWeatherCache();
  const weatherMap = await fetchWeatherForRuns(
    runsWithCoordinates,
    cachedWeather,
  );
  await writeWeatherCache(weatherMap);

  const enrichedRuns = runsWithCoordinates.map((run) => {
    const { coordinates, ...runData } = run;
    const weather = coordinates
      ? weatherMap.get(getWeatherKey(coordinates, run.eventDate)) ?? null
      : null;

    return {
      ...runData,
      coordinates,
      countryISO: getEventCountryISO(run.eventId),
      eventName: getEventShortName(run.eventId) ??
        run.eventName.replace(/ parkrun$/i, ""),
      eventUrl: getEventUrl(run.eventId),
      resultsUrl: getEventResultsUrl(run.eventId, run.eventEdition),
      weather,
    };
  });

  const profile: Profile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    athlete: {
      id: athlete.id,
      fullName: `${capitalize(athlete.firstName)} ${
        capitalize(athlete.lastName)
      }`,
      clubName: athlete.clubName,
      homeRun: athlete.homeRun,
      homeRunShortName: athlete.homeRun
        ? getShortNameByLongName(athlete.homeRun)
        : null,
    },
    runs: enrichedRuns,
  };

  const outputPath = "public/data.json";
  await Deno.mkdir("public", { recursive: true });
  await Deno.writeTextFile(outputPath, JSON.stringify(profile));
  console.log(`Written ${runs.length} runs to ${outputPath}`);
}

downloadData(ATHLETE_ID, PASSWORD).catch((err: Error) => {
  console.error("Failed:", err.message);
  Deno.exit(1);
});
