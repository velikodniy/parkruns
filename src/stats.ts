import type { Run } from "./types.ts";

export interface RunStats {
  totalRuns: number;
  pbCount: number;
  fastestTime: number;
  averageTime: number;
  bestAgeGrade: number;
  bestPosition: number;
  latestRunDate: Date;
  uniqueEvents: number;
}

export function computeRunStats(runs: Run[]): RunStats {
  const times = runs.map((r) => r.finishTimeSeconds);

  return {
    totalRuns: runs.length,
    pbCount: runs.filter((r) => r.wasPB).length,
    fastestTime: Math.min(...times),
    averageTime: Math.round(times.reduce((a, b) => a + b, 0) / runs.length),
    bestAgeGrade: Math.max(...runs.map((r) => r.ageGrade)),
    bestPosition: Math.min(...runs.map((r) => r.position)),
    latestRunDate: new Date(runs[0].eventDate),
    uniqueEvents: new Set(runs.map((r) => r.eventName)).size,
  };
}
