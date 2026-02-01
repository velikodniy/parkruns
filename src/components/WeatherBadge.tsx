import { Box, Group, Text } from "@mantine/core";
import type { Weather } from "../types.ts";

function WeatherIcon({ code }: { code: number }) {
  const size = 14;
  const color = "currentColor";

  if (code === 0 || code === 1) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }

  if (code >= 2 && code <= 3) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  }

  if (code >= 45 && code <= 48) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M4 12h16M4 8h12M8 16h12" />
      </svg>
    );
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      </svg>
    );
  }

  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
        <path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" />
      </svg>
    );
  }

  if (code >= 95) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
        <polyline points="13 11 9 17 15 17 11 23" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function WindArrow({ degrees }: { degrees: number }) {
  const size = 12;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: `rotate(${degrees}deg)` }}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

interface WeatherBadgeProps {
  weather: Weather | null | undefined;
  compact?: boolean;
}

export function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
  if (!weather) return null;

  const temp = Math.round(weather.temperatureC);
  const wind = Math.round(weather.windSpeedMs);

  if (compact) {
    return (
      <Group gap={6} wrap="nowrap">
        <Group gap={4} wrap="nowrap">
          <WeatherIcon code={weather.weatherCode} />
          <Text size="xs" c="dimmed">{temp}°</Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <WindArrow degrees={weather.windDirectionDeg} />
          <Text size="xs" c="dimmed">{wind}</Text>
        </Group>
      </Group>
    );
  }

  return (
    <Box>
      <Group gap={4} wrap="nowrap">
        <WeatherIcon code={weather.weatherCode} />
        <Text size="xs" c="dimmed">{temp}°C</Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <WindArrow degrees={weather.windDirectionDeg} />
        <Text size="xs" c="dimmed">{wind} m/s</Text>
      </Group>
    </Box>
  );
}
