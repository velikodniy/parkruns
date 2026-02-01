import { useMemo } from "react";
import type { Profile, Run } from "../types.ts";
import { computeRunStats, sortRunsByDateDesc } from "../stats.ts";

type RunStats = ReturnType<typeof computeRunStats>;

interface UseRunStatsResult {
  sortedRuns: Run[];
  stats: RunStats | null;
  visitedCountries: string[];
}

export function useRunStats(profile: Profile | null): UseRunStatsResult {
  const sortedRuns = useMemo(() => {
    if (!profile) return [];
    return sortRunsByDateDesc(profile.runs);
  }, [profile]);

  const stats = useMemo(() => {
    if (sortedRuns.length === 0) return null;
    return computeRunStats(sortedRuns);
  }, [sortedRuns]);

  const visitedCountries = useMemo(() => {
    if (sortedRuns.length === 0) return [];
    const countrySet = new Set<string>();
    for (const run of sortedRuns) {
      if (run.countryISO) countrySet.add(run.countryISO);
    }
    return [...countrySet].sort();
  }, [sortedRuns]);

  return { sortedRuns, stats, visitedCountries };
}
