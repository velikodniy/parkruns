import { useMemo } from "react";
import { usePagination } from "@mantine/hooks";
import type { Run } from "../types.ts";

/** A run prepared for display in a paginated list. */
export interface RunsListItem {
  run: Run;
  /** Index of this run within the full (descending) runs array. */
  globalIndex: number;
  /** The chronologically previous run (one position older), or null. */
  previousRun: Run | null;
}

export interface UseRunsListResult {
  items: RunsListItem[];
  pagination: ReturnType<typeof usePagination>;
  totalPages: number;
  /** e.g. "1–10 of 42", or "0 runs" when empty. */
  rangeText: string;
}

/**
 * Pagination state and per-page item preparation shared by the table and card
 * views of the runs list. `runs` is expected in descending date order, so
 * `previousRun` points one position older (the prior race).
 */
export function useRunsList(runs: Run[], pageSize = 10): UseRunsListResult {
  const totalPages = Math.max(1, Math.ceil(runs.length / pageSize));
  const pagination = usePagination({ total: totalPages, initialPage: 1 });
  const pageStart = (pagination.active - 1) * pageSize;

  const items = useMemo<RunsListItem[]>(
    () =>
      runs.slice(pageStart, pageStart + pageSize).map((run, index) => {
        const globalIndex = pageStart + index;
        return {
          run,
          globalIndex,
          previousRun: globalIndex < runs.length - 1
            ? runs[globalIndex + 1]
            : null,
        };
      }),
    [runs, pageStart, pageSize],
  );

  const endIdx = Math.min(pagination.active * pageSize, runs.length);
  const rangeText = runs.length > 0
    ? `${pageStart + 1}–${endIdx} of ${runs.length}`
    : "0 runs";

  return { items, pagination, totalPages, rangeText };
}
