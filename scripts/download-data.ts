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
import { buildProfile } from "../src/lib/parkrun/profile.ts";

const ATHLETE_ID = Deno.env.get("PARKRUN_ATHLETE_ID");
const PASSWORD = Deno.env.get("PARKRUN_PASSWORD");

if (!ATHLETE_ID || !PASSWORD) {
  console.error(
    "PARKRUN_ATHLETE_ID and PARKRUN_PASSWORD environment variables are required",
  );
  Deno.exit(1);
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

  const profile = await buildProfile({
    athlete,
    runs,
    eventCountries: getAllEventCountryISOs(),
    resolveEventContext: getRunEventContext,
    getShortNameByLongName,
    fetchWeather: fetchWeatherForRuns,
    resolveRegions,
    now: () => new Date(),
    log: console.log,
    warn: console.warn,
  });

  const outputPath = "public/data.json";
  await writeTextFileAtomic(outputPath, JSON.stringify(profile));
  console.log(`Written ${runs.length} runs to ${outputPath}`);
}

downloadData(ATHLETE_ID, PASSWORD).catch((err: Error) => {
  console.error("Failed:", err.message);
  Deno.exit(1);
});
