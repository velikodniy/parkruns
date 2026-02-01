import { Box, Group, Text } from "@mantine/core";
import {
  IconArrowUp,
  IconCloud,
  IconCloudFog,
  IconCloudRain,
  IconCloudSnow,
  IconCloudStorm,
  IconSun,
} from "@tabler/icons-react";
import type { Weather } from "../types.ts";

/**
 * Maps WMO weather codes to appropriate Tabler icons.
 * Codes based on Open-Meteo / WMO standards.
 */
function WeatherIcon({ code }: { code: number }) {
  const size = 14;

  // 0: Clear sky
  // 1: Mainly clear
  if (code === 0 || code === 1) {
    return <IconSun size={size} />;
  }

  // 2: Partly cloudy
  // 3: Overcast
  if (code === 2 || code === 3) {
    return <IconCloud size={size} />;
  }

  // 45, 48: Fog and depositing rime fog
  if (code === 45 || code === 48) {
    return <IconCloudFog size={size} />;
  }

  // 51-55: Drizzle
  // 61-67: Rain
  // 80-82: Rain showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return <IconCloudRain size={size} />;
  }

  // 71-77: Snow fall
  // 85-86: Snow showers
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return <IconCloudSnow size={size} />;
  }

  // 95-99: Thunderstorm
  if (code >= 95) {
    return <IconCloudStorm size={size} />;
  }

  return <IconCloud size={size} />;
}

function WindArrow({ degrees }: { degrees: number }) {
  const size = 12;
  return (
    <IconArrowUp
      size={size}
      style={{ transform: `rotate(${degrees}deg)` }}
    />
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
