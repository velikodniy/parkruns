import { useMemo } from "react";
import { Badge, Card, Group, ScrollArea, Table, Text, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";
import { getEventCountryISO, getEventResultsUrl, getEventShortName, getEventUrl } from "../lib/parkrun/index.ts";
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
  const allTimePBs = useMemo(() => computeAllTimePBs(runs), [runs]);

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
            <Table.Th>Position</Table.Th>
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
                  <Group gap={6} wrap="nowrap">
                    <span style={{ width: 16, display: "inline-flex", justifyContent: "center" }}>
                      {(() => {
                        const countryISO = getEventCountryISO(run.eventId);
                        return countryISO ? <CountryFlag countryCode={countryISO} size={10} /> : null;
                      })()}
                    </span>
                    {(() => {
                      const url = getEventUrl(run.eventId);
                      const name = getEventShortName(run.eventId) ?? run.eventName;
                      return url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>{name}</a>
                      ) : <Text span>{name}</Text>;
                    })()}
                    {(() => {
                      const resultsUrl = getEventResultsUrl(run.eventId, run.eventEdition);
                      return resultsUrl ? (
                        <a href={resultsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>
                          <Text span size="sm" c="dimmed">#{run.eventEdition}</Text>
                        </a>
                      ) : <Text span size="sm" c="dimmed">#{run.eventEdition}</Text>;
                    })()}
                  </Group>
                </Table.Td>
                <Table.Td style={{ fontVariantNumeric: "tabular-nums" }}>
                  {run.position}
                  <Text span c="dimmed" inherit>{"\u00A0/\u00A0"}{run.totalFinishers} · {run.ageCategory.startsWith("V") || run.ageCategory.startsWith("S") ? (run.ageCategory.charAt(1) === "M" ? "♂" : "♀") : (run.ageCategory.startsWith("JM") ? "♂" : "♀")}{"\u00A0"}{run.genderPosition} · Top{"\u00A0"}{Math.round((run.position / run.totalFinishers) * 100)}{"\u00A0"}%</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap" align="center">
                    <span style={{ minWidth: 42 }}>{formatTime(run.finishTimeSeconds)}</span>
                    {run.wasPb && isAllTimePB && (
                      <Badge color="blue" size="xs" variant="filled">
                        PB
                      </Badge>
                    )}
                    {run.wasPb && !isAllTimePB && (
                      <Badge color="gray" size="xs" variant="light">
                        PB
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{formatPace(run.finishTimeSeconds)}</Table.Td>
                <Table.Td>
                  <Group gap={0} wrap="nowrap">
                    {run.ageGrade.toFixed(1)}%
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
