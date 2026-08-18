import * as d3 from "d3";
import { eventMonthKey } from "./event-date.ts";
import { getTopFinishes, sortRunsByDateAsc, type TopFinish } from "./stats.ts";
import type { Run } from "./types.ts";

const AXIS_GAP_SECONDS = 15;
const MAX_TIME_SECONDS = 3600;
const MEDAL_COUNT = 3;

export const FINISH_TIME_RUN_LIMIT = 25;

export interface AgeGradeChartData {
  runs: Run[];
  domain: [number, number];
}

export function getAgeGradeDomain(runs: Run[]): [number, number] {
  const minimum = Math.min(
    40,
    d3.min(runs, (run: Run) => run.ageGrade) ?? 40,
  );
  const maximum = d3.max(runs, (run: Run) => run.ageGrade) ?? 100;
  return [minimum - 5, maximum > 100 ? maximum + 5 : 100];
}

export function buildAgeGradeChartData(runs: Run[]): AgeGradeChartData {
  const sortedRuns = sortRunsByDateAsc(runs);
  return {
    runs: sortedRuns,
    domain: getAgeGradeDomain(sortedRuns),
  };
}

export interface FinishTimeChartData {
  visibleRuns: Run[];
  topFinishes: TopFinish[];
  domain: [number, number];
  rollingMedian: number[] | null;
}

export function getFinishTimeDomain(
  visibleRuns: Run[],
  topFinishes: TopFinish[],
): [number, number] {
  const minTime = d3.min(
    visibleRuns,
    (run: Run) => run.finishTimeSeconds,
  ) ?? 0;
  const maxTime = d3.max(
    visibleRuns,
    (run: Run) => run.finishTimeSeconds,
  ) ?? MAX_TIME_SECONDS;
  const medalMin = d3.min(
    topFinishes,
    (finish: TopFinish) => finish.finishTimeSeconds,
  ) ?? minTime;

  return [
    Math.min(minTime, medalMin) - AXIS_GAP_SECONDS,
    maxTime + AXIS_GAP_SECONDS,
  ];
}

export function buildFinishTimeChartData(runs: Run[]): FinishTimeChartData {
  const visibleRuns = sortRunsByDateAsc(runs).slice(-FINISH_TIME_RUN_LIMIT);
  const topFinishes = getTopFinishes(runs, MEDAL_COUNT);
  const windowSize = Math.min(7, Math.floor(visibleRuns.length / 3));
  const rollingMedian = windowSize > 1
    ? visibleRuns.map((_: Run, index: number) => {
      const start = Math.max(0, index - windowSize + 1);
      return d3.median(
        visibleRuns.slice(start, index + 1),
        (run: Run) => run.finishTimeSeconds,
      ) ?? 0;
    })
    : null;

  return {
    visibleRuns,
    topFinishes,
    domain: getFinishTimeDomain(visibleRuns, topFinishes),
    rollingMedian,
  };
}

export interface FinishTimeSummary {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

export interface MonthlyFinishTimeData extends FinishTimeSummary {
  month: string;
}

export function summarizeFinishTimes(
  times: number[],
): FinishTimeSummary | null {
  if (times.length === 0) return null;

  const sortedTimes = [...times].sort(d3.ascending);
  return {
    min: sortedTimes[0],
    q1: Math.round(d3.quantileSorted(sortedTimes, 0.25)!),
    median: Math.round(d3.quantileSorted(sortedTimes, 0.5)!),
    q3: Math.round(d3.quantileSorted(sortedTimes, 0.75)!),
    max: sortedTimes[sortedTimes.length - 1],
    count: sortedTimes.length,
  };
}

export function buildMonthlyFinishTimeData(
  runs: Run[],
): MonthlyFinishTimeData[] {
  const timesByMonth = new Map<string, number[]>();
  for (const run of runs) {
    const month = eventMonthKey(run.eventDate);
    const times = timesByMonth.get(month) ?? [];
    times.push(run.finishTimeSeconds);
    timesByMonth.set(month, times);
  }

  return [...timesByMonth.entries()]
    .map(([month, times]) => ({
      month,
      ...summarizeFinishTimes(times)!,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
