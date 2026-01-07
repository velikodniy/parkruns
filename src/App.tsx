import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
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
import { computeRunStats } from "./stats.ts";
import { getCountryNameByISO, getEventCountryISO } from "./lib/parkrun/index.ts";

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

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    if (!profile || profile.runs.length === 0) return null;
    return computeRunStats(profile.runs);
  }, [profile]);

  const visitedCountries = useMemo(() => {
    if (!profile) return [];
    const countrySet = new Set<string>();
    for (const run of profile.runs) {
      const iso = getEventCountryISO(run.eventId);
      if (iso) countrySet.add(iso);
    }
    return [...countrySet].sort();
  }, [profile]);

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

  const { athlete, runs } = profile;

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
      <Title order={1} mb="xs">
        {athlete.fullName}
      </Title>
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

      <RunsTable runs={runs} />

      <ChartCard title="Events Visited">
        <EventsMap runs={runs} height={400} />
      </ChartCard>

      <ChartCard title="Consistency Calendar">
        <ConsistencyCalendar runs={runs} />
      </ChartCard>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
        <ChartCard title="Finish Time Over Time">
          <FinishTimeChart runs={runs} width={500} height={280} />
        </ChartCard>

        <ChartCard title="PB Progression">
          <PBProgressionChart runs={runs} width={500} height={280} />
        </ChartCard>

        <ChartCard title="Age Grade Over Time">
          <AgeGradeChart runs={runs} width={500} height={280} />
        </ChartCard>

        <ChartCard title="Finish Time Distribution">
          <FinishTimeDistribution runs={runs} width={500} height={280} />
        </ChartCard>
      </SimpleGrid>

      <Text size="xs" c="dimmed" ta="center" mt="xl">
        Last updated: {new Date(profile.generatedAt).toLocaleString()}
      </Text>
    </Container>
  );
}
