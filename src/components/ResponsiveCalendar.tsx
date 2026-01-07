import { Box } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import type { Run } from "../types.ts";
import { ConsistencyCalendar } from "./ConsistencyCalendar.tsx";
import { MonthlySummary } from "./MonthlySummary.tsx";

interface Props {
  runs: Run[];
}

export function ResponsiveCalendar({ runs }: Props) {
  const { ref, width } = useElementSize();
  const calendarWidth = Math.max(width - 32, 300);

  return (
    <>
      <Box hiddenFrom="sm">
        <MonthlySummary runs={runs} />
      </Box>
      <Box visibleFrom="sm" ref={ref} style={{ width: "100%", overflowX: "auto" }}>
        {width > 0 && <ConsistencyCalendar runs={runs} width={calendarWidth} />}
      </Box>
    </>
  );
}
