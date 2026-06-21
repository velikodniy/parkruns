import type { Run } from "./types.ts";

export function sortRunsByDateAsc(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => a.eventDate.localeCompare(b.eventDate),
  );
}

export function sortRunsByDateDesc(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => b.eventDate.localeCompare(a.eventDate),
  );
}

/**
 * Median of a pre-sorted numeric array. The even-length average is rounded to a
 * whole number because the only caller (recentMedianTime) is in whole seconds.
 */
function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Week bucket for a date: whole weeks since the Unix epoch, computed from the
 * UTC calendar date so the bucket is independent of the viewer's timezone.
 * parkruns are held on Saturdays, so consecutive events differ by exactly 1 —
 * which makes streak counting plain integer arithmetic with no year-boundary
 * special cases (53-week years included).
 */
function weekIndex(date: Date): number {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor(utcMidnight / MS_PER_WEEK);
}

/** Count consecutive weeks ending at (or just before) the current week. */
function countCurrentStreak(weeks: Set<number>, currentWeek: number): number {
  let streak = 0;
  let week = weeks.has(currentWeek) ? currentWeek : currentWeek - 1;
  while (weeks.has(week)) {
    streak++;
    week--;
  }
  return streak;
}

/** Longest run of consecutive weeks anywhere in the history. */
function countBestStreak(weeks: Set<number>): number {
  const sorted = [...weeks].sort((a, b) => a - b);
  let best = 0;
  let streak = 0;
  let prev: number | null = null;

  for (const week of sorted) {
    streak = prev !== null && week === prev + 1 ? streak + 1 : 1;
    best = Math.max(best, streak);
    prev = week;
  }
  return best;
}

function computeStreak(runs: Run[]): { current: number; best: number } {
  if (runs.length === 0) return { current: 0, best: 0 };

  const weeks = new Set<number>();
  for (const run of runs) {
    weeks.add(weekIndex(new Date(run.eventDate)));
  }

  return {
    current: countCurrentStreak(weeks, weekIndex(new Date())),
    best: countBestStreak(weeks),
  };
}

export interface RunStats {
  totalRuns: number;
  fastestTime: number;
  recentMedianTime: number; // 5-run median
  bestAgeGrade: number;
  bestAgeGradeCategory: string;
  bestTopPercent: number; // best (lowest) top % finish
  bestTopPercentRun: { position: number; totalFinishers: number } | null;
  uniqueEvents: number;
  streak: { current: number; best: number };
}

export function computeRunStats(runs: Run[]): RunStats {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      fastestTime: Number.POSITIVE_INFINITY,
      recentMedianTime: 0,
      bestAgeGrade: 0,
      bestAgeGradeCategory: "",
      bestTopPercent: 100,
      bestTopPercentRun: null,
      uniqueEvents: 0,
      streak: { current: 0, best: 0 },
    };
  }

  let fastestTime = Number.POSITIVE_INFINITY;
  let bestAgeGrade = 0;
  let bestAgeGradeCategory = "";
  let bestTopPercent = 100;
  let bestTopPercentRun: { position: number; totalFinishers: number } | null =
    null;
  const events = new Set<string>();

  for (const run of runs) {
    if (run.finishTimeSeconds < fastestTime) {
      fastestTime = run.finishTimeSeconds;
    }

    if (run.ageGrade > bestAgeGrade) {
      bestAgeGrade = run.ageGrade;
      bestAgeGradeCategory = run.ageCategory;
    }

    const topPercent = (run.position / run.totalFinishers) * 100;
    if (topPercent < bestTopPercent) {
      bestTopPercent = topPercent;
      bestTopPercentRun = {
        position: run.position,
        totalFinishers: run.totalFinishers,
      };
    }

    events.add(run.eventName);
  }

  // Self-contained: take the 5 most recent runs by date regardless of the
  // caller's ordering, so the median can't silently depend on input order.
  const recentTimes = sortRunsByDateDesc(runs)
    .slice(0, 5)
    .map((r) => r.finishTimeSeconds)
    .sort((a, b) => a - b);

  return {
    totalRuns: runs.length,
    fastestTime,
    recentMedianTime: median(recentTimes),
    bestAgeGrade,
    bestAgeGradeCategory,
    bestTopPercent,
    bestTopPercentRun,
    uniqueEvents: events.size,
    streak: computeStreak(runs),
  };
}
