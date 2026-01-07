import { Paper, Text } from "@mantine/core";

interface StatsCardProps {
  label: string;
  value: string | number;
  secondary?: string;
}

export function StatsCard({ label, value, secondary }: StatsCardProps) {
  return (
    <Paper p="sm" radius="md" withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text size="lg" fw={700}>
        {value}
      </Text>
      {secondary && (
        <Text size="xs" c="dimmed">
          {secondary}
        </Text>
      )}
    </Paper>
  );
}
