import type { Run } from "./types.ts";

export function sortRunsByDateDesc(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
}

/** Compute median of a sorted (ascending) array of numbers */
function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/** Compute current streak (consecutive weeks with a run, starting from most recent) */
function computeStreak(runs: Run[]): { current: number; best: number } {
  if (runs.length === 0) return { current: 0, best: 0 };

  // runs should be sorted desc (most recent first)
  const weeks = new Set<string>();
  for (const run of runs) {
    const d = new Date(run.eventDate);
    // Get ISO week: year-week format
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    weeks.add(`${year}-${week.toString().padStart(2, "0")}`);
  }

  const sortedWeeks = [...weeks].sort().reverse();
  
  // Get current week
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const currentWeekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  const currentWeek = `${year}-${currentWeekNum.toString().padStart(2, "0")}`;

  // Count current streak (consecutive weeks from current or last week)
  let current = 0;
  let checkWeek = currentWeek;
  
  // Allow starting from current week or previous week
  if (!weeks.has(currentWeek)) {
    // Check previous week
    const prevWeekNum = currentWeekNum - 1;
    if (prevWeekNum > 0) {
      checkWeek = `${year}-${prevWeekNum.toString().padStart(2, "0")}`;
    } else {
      checkWeek = `${year - 1}-52`;
    }
  }

  for (const week of sortedWeeks) {
    if (week === checkWeek) {
      current++;
      // Decrement checkWeek
      const [y, w] = checkWeek.split("-").map(Number);
      if (w > 1) {
        checkWeek = `${y}-${(w - 1).toString().padStart(2, "0")}`;
      } else {
        checkWeek = `${y - 1}-52`;
      }
    } else if (week < checkWeek) {
      break;
    }
  }

  // Compute best streak
  let best = 0;
  let streak = 0;
  let prevWeek = "";
  
  for (const week of [...weeks].sort()) {
    if (prevWeek === "") {
      streak = 1;
    } else {
      const [py, pw] = prevWeek.split("-").map(Number);
      const [cy, cw] = week.split("-").map(Number);
      const expectedWeek = pw === 52 ? `${py + 1}-01` : `${py}-${(pw + 1).toString().padStart(2, "0")}`;
      if (week === expectedWeek) {
        streak++;
      } else {
        streak = 1;
      }
    }
    best = Math.max(best, streak);
    prevWeek = week;
  }

  return { current, best };
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
  const times = runs.map((r) => r.finishTimeSeconds);
  
  // 5-run median (most recent 5 runs) - runs should already be sorted desc
  const recent5 = times.slice(0, Math.min(5, times.length));
  const recentMedianTime = median([...recent5].sort((a, b) => a - b));
  
  let bestAgeGrade = 0;
  let bestAgeGradeCategory = "";
  for (const run of runs) {
    if (run.ageGrade > bestAgeGrade) {
      bestAgeGrade = run.ageGrade;
      bestAgeGradeCategory = run.ageCategory;
    }
  }
  
  // Best top % (lowest percentage = best relative finish)
  let bestTopPercent = 100;
  let bestTopPercentRun: { position: number; totalFinishers: number } | null = null;
  for (const run of runs) {
    const topPercent = (run.position / run.totalFinishers) * 100;
    if (topPercent < bestTopPercent) {
      bestTopPercent = topPercent;
      bestTopPercentRun = { position: run.position, totalFinishers: run.totalFinishers };
    }
  }

  return {
    totalRuns: runs.length,
    fastestTime: Math.min(...times),
    recentMedianTime,
    bestAgeGrade,
    bestAgeGradeCategory,
    bestTopPercent,
    bestTopPercentRun,
    uniqueEvents: new Set(runs.map((r) => r.eventName)).size,
    streak: computeStreak(runs),
  };
}
