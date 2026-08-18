import * as d3 from "d3";
import type { Run } from "./types.ts";
import { eventDateToDate } from "./event-date.ts";

export interface WeekData {
  week: Date;
  runs: Run[];
  count: number;
}

export interface CalendarYearData {
  year: number;
  weeks: WeekData[];
}

function yearWeekKey(year: number, week: Date): string {
  return `${year}:${week.getTime()}`;
}

export function buildCalendarYearData(runs: Run[]): CalendarYearData[] {
  if (runs.length === 0) return [];

  const dates = runs.map((run) => eventDateToDate(run.eventDate));
  const minYear = d3.min(dates, (date: Date) => date.getUTCFullYear())!;
  const maxYear = d3.max(dates, (date: Date) => date.getUTCFullYear())!;
  const runsByYearWeek = new Map<string, Run[]>();

  for (const run of runs) {
    const date = eventDateToDate(run.eventDate);
    const year = date.getUTCFullYear();
    const week = d3.utcSunday.floor(date);
    const key = yearWeekKey(year, week);
    const weekRuns = runsByYearWeek.get(key) ?? [];
    weekRuns.push(run);
    runsByYearWeek.set(key, weekRuns);
  }

  return d3.range(minYear, maxYear + 1).map((year: number) => {
    const firstWeek = d3.utcSunday.floor(new Date(Date.UTC(year, 0, 1)));
    const lastWeek = d3.utcSunday.floor(new Date(Date.UTC(year, 11, 31)));
    const weeks = d3.utcSunday.range(
      firstWeek,
      d3.utcSunday.offset(lastWeek, 1),
    ).map((week: Date) => {
      const weekRuns = runsByYearWeek.get(yearWeekKey(year, week)) ?? [];
      return { week, runs: weekRuns, count: weekRuns.length };
    });

    return { year, weeks };
  });
}
