import { Box } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import type { Run } from "../types.ts";
import { ConsistencyCalendar } from "./ConsistencyCalendar.tsx";

interface Props {
  runs: Run[];
}

export function ResponsiveCalendar({ runs }: Props) {
  const { ref, width } = useElementSize();

  return (
    <Box
      ref={ref}
      style={{ width: "100%", overflowX: "auto" }}
    >
      {width > 0 && <ConsistencyCalendar runs={runs} width={width} />}
    </Box>
  );
}
