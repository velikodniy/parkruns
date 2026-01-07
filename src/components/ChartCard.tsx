import { Card, Title } from "@mantine/core";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card withBorder mb="lg">
      <Title order={4} mb="md">
        {title}
      </Title>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </Card>
  );
}
