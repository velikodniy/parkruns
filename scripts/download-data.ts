import { authenticate, getAthlete, getRuns } from "../src/lib/parkrun/api.ts";
import { getEventShortName } from "../src/lib/parkrun/index.ts";
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

  const enrichedRuns = runs.map((run) => ({
    ...run,
    eventName: getEventShortName(run.eventId) ??
      run.eventName.replace(/ parkrun$/i, ""),
  }));

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
    },
    runs: enrichedRuns,
  };

  const outputPath = "public/data.json";
  await Deno.mkdir("public", { recursive: true });
  await Deno.writeTextFile(outputPath, JSON.stringify(profile, null, 2));
  console.log(`Written ${runs.length} runs to ${outputPath}`);
}

downloadData(ATHLETE_ID, PASSWORD).catch((err: Error) => {
  console.error("Failed:", err.message);
  Deno.exit(1);
});
