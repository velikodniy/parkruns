import "@std/dotenv/load";
import { authenticate, getAthlete, getRuns } from "../src/lib/parkrun/api.ts";
import {
  getEventById,
  getEventCoordinates,
  getEventCountryISO,
  getEventResultsUrl,
  getEventShortName,
  getEventUrl,
  getShortNameByLongName,
} from "../src/lib/parkrun/index.ts";
import { getRegionKey, resolveRegions } from "../src/lib/parkrun/regions.ts";
import {
  fetchWeatherForRuns,
  getWeatherKey,
} from "../src/lib/parkrun/weather.ts";
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

  const runsWithCoordinates = runs.map((run) => ({
    ...run,
    coordinates: getEventCoordinates(run.eventId),
  }));

  console.log("Fetching weather data...");
  const weatherMap = await fetchWeatherForRuns(runsWithCoordinates);

  console.log("Resolving regions...");
  const ukEvents = runsWithCoordinates
    .filter((r) => getEventCountryISO(r.eventId) === "gb" && r.coordinates)
    .map((r) => {
      const event = getEventById(r.eventId)!;
      return {
        eventName: event.properties.eventname,
        coordinates: event.geometry.coordinates,
      };
    });
  const regionMap = await resolveRegions(ukEvents);

  const enrichedRuns = runsWithCoordinates.map((run) => {
    const { coordinates, ...runData } = run;
    const weather = coordinates
      ? weatherMap.get(getWeatherKey(coordinates, run.eventDate)) ?? null
      : null;

    let countryISO = getEventCountryISO(run.eventId);
    if (countryISO === "gb") {
      const event = getEventById(run.eventId);
      if (event) {
        countryISO = regionMap.get(
          getRegionKey(event.geometry.coordinates),
        ) ?? countryISO;
      }
    }

    return {
      ...runData,
      coordinates,
      countryISO,
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
