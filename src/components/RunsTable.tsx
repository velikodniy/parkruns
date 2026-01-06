import { Badge, Card, Group, Table, Text, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";

interface Props {
  runs: Run[];
}

function AgeGradeDelta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return <Text span size="xs" c="dimmed">—</Text>;
  }

  const delta = current - previous;
  const isPositive = delta > 0;
  const color = isPositive ? "green" : "red";
  const arrow = isPositive ? "↑" : "↓";
  const sign = isPositive ? "+" : "";

  return (
    <Text span size="xs" c={color} ml={4}>
      {arrow}{sign}{delta.toFixed(1)}%
    </Text>
  );
}

export function RunsTable({ runs }: Props) {
  return (
    <Card withBorder>
      <Title order={3} mb="md">
        All Runs
      </Title>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Event</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th>Pace</Table.Th>
            <Table.Th>Pos</Table.Th>
            <Table.Th>Age Grade</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {runs.map((run: Run, index: number) => {
            const previousRun = index < runs.length - 1 ? runs[index + 1] : null;
            const previousAgeGrade = previousRun?.ageGrade ?? null;

            return (
              <Table.Tr key={`${run.eventDate}-${run.eventId}`}>
                <Table.Td>
                  {new Date(run.eventDate).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Text span>{run.eventName}</Text>
                    <Text span size="sm" c="dimmed">#{run.runNumber}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text span>{formatTime(run.finishTimeSeconds)}</Text>
                    {run.wasPB && (
                      <Badge color="green" size="xs" variant="filled">
                        PB
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{formatPace(run.finishTimeSeconds)}</Table.Td>
                <Table.Td>{run.position}</Table.Td>
                <Table.Td>
                  <Group gap={0} wrap="nowrap">
                    <Text span>{run.ageGrade.toFixed(1)}%</Text>
                    <AgeGradeDelta current={run.ageGrade} previous={previousAgeGrade} />
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
