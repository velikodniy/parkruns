import { useMemo } from "react";
import { Box } from "@mantine/core";
import type { Run } from "../types.ts";
import { RunsTable } from "./RunsTable.tsx";
import { RunsCardList } from "./RunsCardList.tsx";
import { computeAllTimePBs } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

export function ResponsiveRuns({ runs }: Props) {
  // Computed once here and shared by both views (both mount via CSS visibility).
  const pbRuns = useMemo(() => computeAllTimePBs(runs), [runs]);

  return (
    <Box mb="lg">
      <Box hiddenFrom="sm">
        <RunsCardList runs={runs} pbRuns={pbRuns} />
      </Box>
      <Box visibleFrom="sm">
        <RunsTable runs={runs} pbRuns={pbRuns} />
      </Box>
    </Box>
  );
}
