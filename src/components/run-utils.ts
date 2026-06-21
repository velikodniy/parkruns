import type { Run } from "../types.ts";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getGenderSymbol(ageCategory: string): string {
  if (ageCategory.startsWith("V") || ageCategory.startsWith("S")) {
    return ageCategory.charAt(1) === "M" ? "♂" : "♀";
  }
  return ageCategory.startsWith("JM") ? "♂" : "♀";
}

export function runKey(run: Run): string {
  return `${run.eventDate}-${run.eventId}`;
}

export function computeAllTimePBs(runs: Run[]): Set<string> {
  const pbs = new Set<string>();
  let bestTime = Number.POSITIVE_INFINITY;

  for (let i = runs.length - 1; i >= 0; i--) {
    if (runs[i].finishTimeSeconds < bestTime) {
      bestTime = runs[i].finishTimeSeconds;
      pbs.add(runKey(runs[i]));
    }
  }
  return pbs;
}

export function formatDelta(
  current: number,
  previous: number | null,
): { text: string; color: string } | null {
  if (previous === null) return null;

  // Decide direction from the value as displayed (1 decimal) so the arrow and
  // colour can never disagree with the number — e.g. a +0.04 delta reads as
  // "0.0%", which should look flat, not like an improvement.
  const delta = Number((current - previous).toFixed(1));

  if (delta > 0) {
    return { text: `↑ +${delta.toFixed(1)}%`, color: "green" };
  }
  if (delta < 0) {
    // toFixed already carries the minus sign for negatives.
    return { text: `↓ ${delta.toFixed(1)}%`, color: "red" };
  }
  return { text: "→ 0.0%", color: "dimmed" };
}
