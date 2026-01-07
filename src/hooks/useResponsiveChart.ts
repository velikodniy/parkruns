import { useElementSize } from "@mantine/hooks";

interface ResponsiveChartResult {
  ref: React.RefObject<HTMLDivElement>;
  width: number;
}

export function useResponsiveChart(minWidth = 300): ResponsiveChartResult {
  const { ref, width } = useElementSize();
  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    width: Math.max(width, minWidth),
  };
}
