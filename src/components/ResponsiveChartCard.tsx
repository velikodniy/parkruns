import { Card, Title } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";

interface ResponsiveChartCardProps {
  title: string;
  children: (width: number) => React.ReactNode;
}

export function ResponsiveChartCard(
  { title, children }: ResponsiveChartCardProps,
) {
  const { ref, width } = useElementSize();
  const chartWidth = Math.max(width - 32, 280);

  return (
    <Card withBorder mb="lg">
      <Title order={4} mb="md">
        {title}
      </Title>
      <div ref={ref} style={{ width: "100%" }}>
        {width > 0 && children(chartWidth)}
      </div>
    </Card>
  );
}
