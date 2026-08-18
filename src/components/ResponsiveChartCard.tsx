import { useElementSize } from "@mantine/hooks";
import { ChartCard } from "./ChartCard.tsx";

/** Floor so charts stay legible inside a narrow column before scrolling. */
const MIN_CHART_WIDTH = 280;

interface ResponsiveChartCardProps {
  title: string;
  children: (width: number) => React.ReactNode;
}

export function ResponsiveChartCard(
  { title, children }: ResponsiveChartCardProps,
) {
  const { ref, width } = useElementSize();
  const chartWidth = Math.max(width, MIN_CHART_WIDTH);

  return (
    <ChartCard title={title}>
      <div ref={ref} style={{ width: "100%" }}>
        {width > 0 && children(chartWidth)}
      </div>
    </ChartCard>
  );
}
