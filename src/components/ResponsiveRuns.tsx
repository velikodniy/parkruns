import { useMemo } from "react";
import { Box } from "@mantine/core";
import type { Run } from "../types.ts";
import { getTopFinishes } from "../stats.ts";
import { useRunsList } from "../hooks/useRunsList.ts";
import { RunsTable } from "./RunsTable.tsx";
import { RunsCardList } from "./RunsCardList.tsx";
import { runKey } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

export function ResponsiveRuns({ runs }: Props) {
  const runsList = useRunsList(runs);
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
        <RunsCardList runsList={runsList} medalRanks={medalRanks} />
      </Box>
      <Box visibleFrom="sm">
        <RunsTable runsList={runsList} medalRanks={medalRanks} />
      </Box>
    </Box>
  );
}
