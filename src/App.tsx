import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { type Profile, ProfileSchema } from "./types.ts";
import {
  AgeGradeChart,
  ConsistencyCalendar,
  CountryFlag,
  EventsMap,
  FinishTimeChart,
  FinishTimeDistribution,
  PBProgressionChart,
  RunsTable,
} from "./components/index.ts";
import { formatTime } from "./format.ts";
import { computeRunStats, sortRunsByDateDesc } from "./stats.ts";
import { getCountryNameByISO, getEventCountryISO } from "./lib/parkrun/index.ts";
import { THEME_STORAGE_KEY, setChartColorScheme } from "./theme.ts";

function StatsCard(
  { label, value }: { label: string; value: string | number },
) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text size="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  );
}

function ChartCard(
  { title, children }: { title: string; children: React.ReactNode },
) {
  return (
    <Card withBorder mb="lg">
      <Title order={4} mb="md">
        {title}
      </Title>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </Card>
  );
}

interface ResponsiveChartProps {
  title: string;
  height: number;
  children: (width: number) => React.ReactNode;
}

function ResponsiveChartCard({ title, height, children }: ResponsiveChartProps) {
  const { ref, width } = useElementSize();
  const chartWidth = Math.max(width - 32, 280);

  return (
    <Card withBorder mb="lg">
      <Title order={4} mb="md">
        {title}
      </Title>
      <div ref={ref} style={{ width: "100%" }}>
        {width > 0 && children(chartWidth)}
      </div>
    </Card>
  );
}

function ThemeToggle({ onToggle }: { onToggle: () => void }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggle = () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    setChartColorScheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    onToggle();
  };

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggle}
      aria-label="Toggle color scheme"
    >
      {colorScheme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
    </ActionIcon>
  );
}

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const parsed = ProfileSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Invalid data: ${parsed.error.message}`);
        }
        setProfile(parsed.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const sortedRuns = useMemo(() => {
    if (!profile) return [];
    return sortRunsByDateDesc(profile.runs);
  }, [profile]);

  const stats = useMemo(() => {
    if (sortedRuns.length === 0) return null;
    return computeRunStats(sortedRuns);
  }, [sortedRuns]);

  const visitedCountries = useMemo(() => {
    if (sortedRuns.length === 0) return [];
    const countrySet = new Set<string>();
    for (const run of sortedRuns) {
      const iso = getEventCountryISO(run.eventId);
      if (iso) countrySet.add(iso);
    }
    return [...countrySet].sort();
  }, [sortedRuns]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="Error loading data">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!profile) return null;

  const { athlete } = profile;

  if (!stats) {
    return (
      <Container size="lg" py="xl">
        <Title order={1} mb="xs">
          {athlete.fullName}
        </Title>
        <Alert color="blue" title="No runs yet">
          No parkrun results to display.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="flex-start" mb="xs">
        <Title order={1}>
          {athlete.fullName}
        </Title>
        <ThemeToggle onToggle={() => setChartKey((k) => k + 1)} />
      </Group>
      <Text c="dimmed" mb="sm">
        {[
          athlete.homeRun && `Home: ${athlete.homeRun}`,
          athlete.clubName && `Club: ${athlete.clubName}`,
        ].filter(Boolean).join(" | ")}
      </Text>

      {visitedCountries.length > 0 && (
        <Group gap="xs" mb="xl">
          {visitedCountries.map((iso) => (
            <CountryFlag key={iso} countryCode={iso} size={18} title={getCountryNameByISO(iso) ?? iso} />
          ))}
        </Group>
      )}

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <StatsCard label="Total Runs" value={stats.totalRuns} />
        <StatsCard label="PBs" value={stats.pbCount} />
        <StatsCard label="Fastest" value={formatTime(stats.fastestTime)} />
        <StatsCard label="Average Time" value={formatTime(stats.averageTime)} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <StatsCard
          label="Best Age Grade"
          value={`${stats.bestAgeGrade.toFixed(1)}%`}
        />
        <StatsCard label="Best Position" value={stats.bestPosition} />
        <StatsCard
          label="Latest Run"
          value={stats.latestRunDate.toLocaleDateString()}
        />
        <StatsCard label="Events Visited" value={stats.uniqueEvents} />
      </SimpleGrid>

      <RunsTable runs={sortedRuns} />

      <ChartCard title="Events Visited">
        <EventsMap runs={sortedRuns} height={400} />
      </ChartCard>

      <ChartCard title="Consistency Calendar">
        <ConsistencyCalendar key={chartKey} runs={sortedRuns} />
      </ChartCard>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
        <ResponsiveChartCard title="Finish Time Over Time" height={280}>
          {(width) => <FinishTimeChart key={chartKey} runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="PB Progression" height={280}>
          {(width) => <PBProgressionChart key={chartKey} runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="Age Grade Over Time" height={280}>
          {(width) => <AgeGradeChart key={chartKey} runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="Finish Time Distribution" height={280}>
          {(width) => <FinishTimeDistribution key={chartKey} runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>
      </SimpleGrid>

      <Text size="xs" c="dimmed" ta="center" mt="xl">
        Last updated: {new Date(profile.generatedAt).toLocaleString()}
      </Text>
    </Container>
  );
}
