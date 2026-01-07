import { Badge, Box, Group, Paper, Stack, Text } from "@mantine/core";
import type { Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";
import { getEventCountryISO, getEventResultsUrl, getEventShortName, getEventUrl } from "../lib/parkrun/index.ts";
import { CountryFlag } from "./CountryFlag.tsx";
import { DAYS, formatDelta, getGenderSymbol } from "./run-utils.ts";

interface Props {
  run: Run;
  isAllTimePB: boolean;
  previousAgeGrade: number | null;
}

export function RunCard({ run, isAllTimePB, previousAgeGrade }: Props) {
  const date = new Date(run.eventDate);
  const delta = formatDelta(run.ageGrade, previousAgeGrade);
  const countryISO = getEventCountryISO(run.eventId);
  const eventUrl = getEventUrl(run.eventId);
  const resultsUrl = getEventResultsUrl(run.eventId, run.eventEdition);
  const eventName = getEventShortName(run.eventId) ?? run.eventName;
  const topPercent = Math.round((run.position / run.totalFinishers) * 100);
  const genderSymbol = getGenderSymbol(run.ageCategory);

  return (
    <Paper withBorder p="sm" radius="sm">
      <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          {countryISO && (
            <Box style={{ flexShrink: 0 }}>
              <CountryFlag countryCode={countryISO} size={14} />
            </Box>
          )}
          <Text size="sm" fw={500} truncate style={{ minWidth: 0 }}>
            {eventUrl ? (
              <a
                href={eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {eventName}
              </a>
            ) : (
              eventName
            )}
          </Text>
          {resultsUrl ? (
            <a
              href={resultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none", flexShrink: 0 }}
            >
              <Text size="xs" c="dimmed">#{run.eventEdition}</Text>
            </a>
          ) : (
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>#{run.eventEdition}</Text>
          )}
        </Group>
        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
          {DAYS[date.getDay()]} {date.toLocaleDateString()}
        </Text>
      </Group>

      <Stack gap={4}>
        <Group gap="xs" align="center">
          <Text size="lg" fw={600} style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatTime(run.finishTimeSeconds)}
          </Text>
          {run.wasPb && isAllTimePB && (
            <Badge color="blue" size="xs" variant="filled">PB</Badge>
          )}
          {run.wasPb && !isAllTimePB && (
            <Badge color="gray" size="xs" variant="light">PB</Badge>
          )}
          <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatPace(run.finishTimeSeconds)}
          </Text>
        </Group>

        <Group gap="md">
          <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
            {run.position}/{run.totalFinishers}
            {" "}
            <Text span inherit>({genderSymbol}{run.genderPosition} · Top {topPercent}%)</Text>
          </Text>
          <Text size="xs" style={{ fontVariantNumeric: "tabular-nums" }}>
            <Text span c="dimmed">AG:</Text>{" "}
            {run.ageGrade.toFixed(1)}%
            {delta && (
              <Text span c={delta.color} ml={4}>{delta.text}</Text>
            )}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
