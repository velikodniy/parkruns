import { writeTextFileAtomic } from "../src/lib/fs.ts";
import { validateEventsUpdate } from "../src/lib/parkrun/types.ts";

const EVENTS_PATH = "src/lib/parkrun/events.json";

export async function updateEventsData(candidatePath: string): Promise<void> {
  const [currentText, candidateText] = await Promise.all([
    Deno.readTextFile(EVENTS_PATH),
    Deno.readTextFile(candidatePath),
  ]);

  const currentValue: unknown = JSON.parse(currentText);
  const candidateValue: unknown = JSON.parse(candidateText);
  const candidate = validateEventsUpdate(currentValue, candidateValue);

  await writeTextFileAtomic(EVENTS_PATH, candidateText);
  console.log(
    `Validated ${candidate.events.features.length} events and updated ${EVENTS_PATH}`,
  );
}

if (import.meta.main) {
  const candidatePath = Deno.args[0];
  if (!candidatePath) {
    console.error(
      "Usage: deno run -A scripts/update-events-data.ts <candidate>",
    );
    Deno.exit(1);
  }

  await updateEventsData(candidatePath);
}
