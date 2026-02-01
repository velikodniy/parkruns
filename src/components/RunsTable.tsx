import { useMemo } from "react";
import { Badge, Card, ScrollArea, Table, Text, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";
import { CountryFlag } from "./CountryFlag.tsx";
import { WeatherBadge } from "./WeatherBadge.tsx";
import {
  computeAllTimePBs,
  DAYS,
  formatDelta,
  getGenderSymbol,
} from "./run-utils.ts";

interface Props {
  runs: Run[];
}

interface CellProps {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}

function Cell({ primary, secondary }: CellProps) {
  return (
    <div>
      <div style={{ lineHeight: 1.4 }}>{primary}</div>
      {secondary && (
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
          {secondary}
        </Text>
      )}
    </div>
  );
}

const linkStyle = { color: "inherit", textDecoration: "none" };

function EventLink(
  { url, children }: { url: string | null; children: React.ReactNode },
) {
  if (!url) return <>{children}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
      onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
    >
      {children}
    </a>
  );
}

interface EventCellProps {
  eventName: string;
  eventEdition: number;
  countryISO?: string | null;
  eventUrl?: string | null;
  resultsUrl?: string | null;
}

function EventCell({
  eventName,
  eventEdition,
  countryISO,
  eventUrl,
  resultsUrl,
}: EventCellProps) {
  return (
    <Cell
      primary={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 16,
              display: "inline-flex",
              justifyContent: "center",
            }}
          >
            {countryISO && <CountryFlag countryCode={countryISO} size={10} />}
          </span>
          <EventLink url={eventUrl || null}>{eventName}</EventLink>
          <EventLink url={resultsUrl || null}>
            <Text span size="xs" c="dimmed">#{eventEdition}</Text>
          </EventLink>
        </span>
      }
    />
  );
}

interface TimeCellProps {
  finishTimeSeconds: number;
  wasPb: boolean;
  isAllTimePB: boolean;
}

function TimeCell({ finishTimeSeconds, wasPb, isAllTimePB }: TimeCellProps) {
  return (
    <div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span>{formatTime(finishTimeSeconds)}</span>
        {wasPb && isAllTimePB && (
          <Badge
            color="blue"
            size="xs"
            variant="filled"
            style={{ flexShrink: 0 }}
          >
            PB
          </Badge>
        )}
        {wasPb && !isAllTimePB && (
          <Badge
            color="gray"
            size="xs"
            variant="light"
            style={{ flexShrink: 0 }}
          >
            PB
          </Badge>
        )}
      </span>
      <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
        {formatPace(finishTimeSeconds)}
      </Text>
    </div>
  );
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
              <Table.Th>Age Grade</Table.Th>
              <Table.Th>Weather</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runs.map((run: Run, index: number) => {
              const date = new Date(run.eventDate);
              const previousRun = index < runs.length - 1
                ? runs[index + 1]
                : null;
              const previousAgeGrade = previousRun?.ageGrade ?? null;
              const isAllTimePB = allTimePBs[index];
              const delta = formatDelta(run.ageGrade, previousAgeGrade);

              return (
                <Table.Tr key={`${run.eventDate}-${run.eventId}`}>
                  <Table.Td>
                    <Cell
                      primary={
                        <>
                          {date.toLocaleDateString()}
                          {"\u00A0"}
                          <Text span size="xs" c="dimmed">
                            {DAYS[date.getDay()]}
                          </Text>
                        </>
                      }
                    />
                  </Table.Td>

                  <Table.Td>
                    <EventCell
                      eventName={run.eventName}
                      eventEdition={run.eventEdition}
                      countryISO={run.countryISO}
                      eventUrl={run.eventUrl}
                      resultsUrl={run.resultsUrl}
                    />
                  </Table.Td>

                  <Table.Td style={{ fontVariantNumeric: "tabular-nums" }}>
                    <Cell
                      primary={
                        <>
                          {run.position}
                          <Text span c="dimmed" inherit>
                            {"\u00A0/\u00A0"}
                            {run.totalFinishers}
                          </Text>
                        </>
                      }
                      secondary={`${
                        getGenderSymbol(run.ageCategory)
                      }\u00A0${run.genderPosition} · Top\u00A0${
                        Math.round((run.position / run.totalFinishers) * 100)
                      }\u00A0%`}
                    />
                  </Table.Td>

                  <Table.Td style={{ fontVariantNumeric: "tabular-nums" }}>
                    <TimeCell
                      finishTimeSeconds={run.finishTimeSeconds}
                      wasPb={run.wasPb}
                      isAllTimePB={isAllTimePB}
                    />
                  </Table.Td>

                  <Table.Td style={{ fontVariantNumeric: "tabular-nums" }}>
                    <Cell
                      primary={`${run.ageGrade.toFixed(1)}%`}
                      secondary={delta
                        ? <Text span c={delta.color} inherit>{delta.text}</Text>
                        : "—"}
                    />
                  </Table.Td>

                  <Table.Td>
                    <WeatherBadge weather={run.weather} />
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
