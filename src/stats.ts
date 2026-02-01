import type { Run } from "./types.ts";

export function sortRunsByDateDesc(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

const MS_PER_DAY = 86400000;

function getYearWeek(date: Date): string {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - jan1.getTime()) / MS_PER_DAY);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, "0")}`;
}

function getPreviousWeek(weekStr: string): string {
  const [year, week] = weekStr.split("-").map(Number);
  if (week > 1) {
    return `${year}-${(week - 1).toString().padStart(2, "0")}`;
  }
  return `${year - 1}-52`;
}

function getNextWeek(weekStr: string): string {
  const [year, week] = weekStr.split("-").map(Number);
  if (week < 52) {
    return `${year}-${(week + 1).toString().padStart(2, "0")}`;
  }
  return `${year + 1}-01`;
}

function countCurrentStreak(weeks: Set<string>, currentWeek: string): number {
  let streak = 0;
  let checkWeek = weeks.has(currentWeek)
    ? currentWeek
    : getPreviousWeek(currentWeek);

  const sortedWeeks = [...weeks].sort().reverse();
  for (const week of sortedWeeks) {
    if (week === checkWeek) {
      streak++;
      checkWeek = getPreviousWeek(checkWeek);
    } else if (week < checkWeek) {
      break;
    }
  }
  return streak;
}

function countBestStreak(weeks: Set<string>): number {
  const sortedWeeks = [...weeks].sort();
  let best = 0;
  let streak = 0;
  let prevWeek = "";

  for (const week of sortedWeeks) {
    if (prevWeek === "" || week === getNextWeek(prevWeek)) {
      streak++;
    } else {
      streak = 1;
    }
    best = Math.max(best, streak);
    prevWeek = week;
  }
  return best;
}

function computeStreak(runs: Run[]): { current: number; best: number } {
  if (runs.length === 0) return { current: 0, best: 0 };

  const weeks = new Set<string>();
  for (const run of runs) {
    weeks.add(getYearWeek(new Date(run.eventDate)));
  }

  const currentWeek = getYearWeek(new Date());

  return {
    current: countCurrentStreak(weeks, currentWeek),
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
  const recent5Times: number[] = [];

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];

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

    if (i < 5) {
      recent5Times.push(run.finishTimeSeconds);
    }
  }

  return {
    totalRuns: runs.length,
    fastestTime,
    recentMedianTime: median([...recent5Times].sort((a, b) => a - b)),
    bestAgeGrade,
    bestAgeGradeCategory,
    bestTopPercent,
    bestTopPercentRun,
    uniqueEvents: events.size,
    streak: computeStreak(runs),
  };
}
