import type { Run } from "../types.ts";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getGenderSymbol(ageCategory: string): string {
  if (ageCategory.startsWith("V") || ageCategory.startsWith("S")) {
    return ageCategory.charAt(1) === "M" ? "♂" : "♀";
  }
  return ageCategory.startsWith("JM") ? "♂" : "♀";
}

export function computeAllTimePBs(runs: Run[]): boolean[] {
  const result: boolean[] = new Array(runs.length).fill(false);
  let bestTime = Number.POSITIVE_INFINITY;

  for (let i = runs.length - 1; i >= 0; i--) {
    if (runs[i].finishTimeSeconds < bestTime) {
      bestTime = runs[i].finishTimeSeconds;
      result[i] = true;
    }
  }
  return result;
}

export function formatDelta(current: number, previous: number | null): { text: string; color: string } | null {
  if (previous === null) return null;
  const delta = current - previous;
  const isPositive = delta > 0;
  return {
    text: `${isPositive ? "↑" : "↓"} ${isPositive ? "+" : ""}${delta.toFixed(1)}%`,
    color: isPositive ? "green" : "red",
  };
}
