import type { Run } from "./types.ts";

export function sortRunsByDateDesc(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
}

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
  const dates = runs.map((r) => new Date(r.eventDate).getTime());

  return {
    totalRuns: runs.length,
    pbCount: runs.filter((r) => r.wasPb).length,
    fastestTime: Math.min(...times),
    averageTime: Math.round(times.reduce((a, b) => a + b, 0) / runs.length),
    bestAgeGrade: Math.max(...runs.map((r) => r.ageGrade)),
    bestPosition: Math.min(...runs.map((r) => r.position)),
    latestRunDate: new Date(Math.max(...dates)),
    uniqueEvents: new Set(runs.map((r) => r.eventName)).size,
  };
}
