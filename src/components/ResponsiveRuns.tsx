import { useMemo } from "react";
import { Box } from "@mantine/core";
import type { Run } from "../types.ts";
import { getTopFinishes } from "../stats.ts";
import { RunsTable } from "./RunsTable.tsx";
import { RunsCardList } from "./RunsCardList.tsx";
import { runKey } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

export function ResponsiveRuns({ runs }: Props) {
  // Computed once here and shared by both views (both mount via CSS visibility).
  const medalRanks = useMemo(
    () =>
      new Map(
        getTopFinishes(runs).map((finish) => [
          runKey(finish.run),
          finish.rank,
        ]),
      ),
    [runs],
  );

  return (
    <Box mb="lg">
      <Box hiddenFrom="sm">
        <RunsCardList runs={runs} medalRanks={medalRanks} />
      </Box>
      <Box visibleFrom="sm">
        <RunsTable runs={runs} medalRanks={medalRanks} />
      </Box>
    </Box>
  );
}
