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
      <Box mb="xs">
        <Group gap={6} wrap="nowrap" align="center">
          {countryISO && (
            <Box style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
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
              style={{ color: "inherit", textDecoration: "none", flexShrink: 0, display: "inline-flex", alignItems: "center" }}
            >
              <Text size="xs" c="dimmed" span>#{run.eventEdition}</Text>
            </a>
          ) : (
            <Text size="xs" c="dimmed" span style={{ flexShrink: 0 }}>#{run.eventEdition}</Text>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {DAYS[date.getDay()]} {date.toLocaleDateString()}
        </Text>
      </Box>

      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Box style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Text size="lg" fw={600} span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatTime(run.finishTimeSeconds)}
            </Text>
            {run.wasPb && isAllTimePB && (
              <Badge color="blue" size="xs" variant="filled" style={{ flexShrink: 0 }}>PB</Badge>
            )}
            {run.wasPb && !isAllTimePB && (
              <Badge color="gray" size="xs" variant="light" style={{ flexShrink: 0 }}>PB</Badge>
            )}
          </Box>
          <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatPace(run.finishTimeSeconds)}
          </Text>
          <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
            {run.position}/{run.totalFinishers} · {genderSymbol}{run.genderPosition} · Top {topPercent}%
          </Text>
        </Stack>

        <Stack gap={0} align="flex-end">
          <Text size="lg" fw={600} style={{ fontVariantNumeric: "tabular-nums" }}>
            <Text span c="dimmed" fw={400} size="sm">AG: </Text>
            {run.ageGrade.toFixed(1)}%
          </Text>
          {delta && (
            <Text size="xs" c={delta.color} fw={500} style={{ fontVariantNumeric: "tabular-nums" }}>
              {delta.text}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
