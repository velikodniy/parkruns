import "@std/dotenv/load";
import { authenticate, getAthlete, getRuns } from "../src/lib/parkrun/api.ts";
import {
  getAllEventCountryISOs,
  getRunEventContext,
  getShortNameByLongName,
} from "../src/lib/parkrun/index.ts";
import { resolveRegions } from "../src/lib/parkrun/regions.ts";
import { writeTextFileAtomic } from "../src/lib/fs.ts";
import { fetchWeatherForRuns } from "../src/lib/parkrun/weather.ts";
import { enrichRuns } from "../src/lib/parkrun/enrich.ts";
import { contextualizeRuns } from "../src/lib/parkrun/event-context.ts";
import type { Profile } from "../src/types.ts";

const ATHLETE_ID = Deno.env.get("PARKRUN_ATHLETE_ID");
const PASSWORD = Deno.env.get("PARKRUN_PASSWORD");

if (!ATHLETE_ID || !PASSWORD) {
  console.error(
    "PARKRUN_ATHLETE_ID and PARKRUN_PASSWORD environment variables are required",
  );
  Deno.exit(1);
}

function capitalize(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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

  const contextualRuns = contextualizeRuns(runs, getRunEventContext);

  console.log("Fetching weather data...");
  const weatherRuns = contextualRuns.flatMap(({ run, event }) => {
    if (event.coordinates === null || event.weatherHour === null) return [];
    return [{
      eventDate: run.eventDate,
      coordinates: event.coordinates,
      weatherHour: event.weatherHour,
    }];
  });
  const omittedWeatherRuns = contextualRuns.length - weatherRuns.length;
  if (omittedWeatherRuns > 0) {
    console.warn(
      `Skipping weather for ${omittedWeatherRuns} runs with no verified event schedule`,
    );
  }
  const weatherMap = await fetchWeatherForRuns(
    weatherRuns,
  );

  console.log("Resolving regions...");
  const ukEvents = contextualRuns.flatMap(({ event }) =>
    event.countryISO === "gb" && event.regionCoordinates
      ? [{ coordinates: event.regionCoordinates }]
      : []
  );
  const regionMap = await resolveRegions(ukEvents);

  const enrichedRuns = enrichRuns(
    contextualRuns,
    { weather: weatherMap, regions: regionMap },
  );

  const profile: Profile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    eventCountries: getAllEventCountryISOs(),
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
  await writeTextFileAtomic(outputPath, JSON.stringify(profile));
  console.log(`Written ${runs.length} runs to ${outputPath}`);
}

downloadData(ATHLETE_ID, PASSWORD).catch((err: Error) => {
  console.error("Failed:", err.message);
  Deno.exit(1);
});
