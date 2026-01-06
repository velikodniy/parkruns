import { Badge, Card, Group, ScrollArea, Table, Text, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";
import { getEventCountryISO } from "../../lib/parkrun/index.ts";
import { CountryFlag } from "./CountryFlag.tsx";

interface Props {
  runs: Run[];
}

function AgeGradeDelta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return <Text span size="xs" c="dimmed" ml={4}>—</Text>;
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

function computeAllTimePBs(runs: Run[]): boolean[] {
  const result: boolean[] = new Array(runs.length).fill(false);
  let bestTime = Number.POSITIVE_INFINITY;

  for (let i = runs.length - 1; i >= 0; i--) {
    if (runs[i].finishTimeSeconds < bestTime) {
      bestTime = runs[i].finishTimeSeconds;
      result[i] = true;
    }
  }
  return result;
}

export function RunsTable({ runs }: Props) {
  const allTimePBs = computeAllTimePBs(runs);

  return (
    <Card withBorder>
      <Title order={3} mb="md">
        All Runs
      </Title>
      <ScrollArea>
      <Table striped highlightOnHover miw={600}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Event</Table.Th>
            <Table.Th>Pos</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th>Pace</Table.Th>
            <Table.Th>Age Grade</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {runs.map((run: Run, index: number) => {
            const previousRun = index < runs.length - 1 ? runs[index + 1] : null;
            const previousAgeGrade = previousRun?.ageGrade ?? null;
            const isAllTimePB = allTimePBs[index];

            return (
              <Table.Tr key={`${run.eventDate}-${run.eventId}`}>
                <Table.Td>
                  {new Date(run.eventDate).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    {(() => {
                      const countryISO = getEventCountryISO(run.eventId);
                      return countryISO ? <CountryFlag countryCode={countryISO} size={14} /> : null;
                    })()}
                    <Text span>{run.eventName}</Text>
                    <Text span size="sm" c="dimmed">#{run.runNumber}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{run.position}</Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap" align="center">
                    <Text span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatTime(run.finishTimeSeconds)}
                    </Text>
                    {run.wasPB && isAllTimePB && (
                      <Badge color="blue" size="xs" variant="filled">
                        PB
                      </Badge>
                    )}
                    {run.wasPB && !isAllTimePB && (
                      <Badge color="gray" size="xs" variant="light">
                        PB
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{formatPace(run.finishTimeSeconds)}</Table.Td>
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
      </ScrollArea>
    </Card>
  );
}
