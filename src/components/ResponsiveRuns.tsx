import { Box } from "@mantine/core";
import type { Run } from "../types.ts";
import { RunsTable } from "./RunsTable.tsx";
import { RunsCardList } from "./RunsCardList.tsx";

interface Props {
  runs: Run[];
}

export function ResponsiveRuns({ runs }: Props) {
  return (
    <Box mb="lg">
      <Box hiddenFrom="sm">
        <RunsCardList runs={runs} />
      </Box>
      <Box visibleFrom="sm">
        <RunsTable runs={runs} />
      </Box>
    </Box>
  );
}
