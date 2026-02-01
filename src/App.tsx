import {
  Alert,
  Container,
  Group,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import {
  AgeGradeChart,
  ChartCard,
  CountryFlag,
  ErrorState,
  EventsMap,
  FinishTimeChart,
  FinishTimeDistribution,
  LoadingState,
  PBProgressionChart,
  ResponsiveCalendar,
  ResponsiveChartCard,
  ResponsiveRuns,
  StatsCard,
  ThemeToggle,
} from "./components/index.ts";
import { formatPace, formatTime } from "./format.ts";
import { getCountryNameByISO, getShortNameByLongName } from "./lib/parkrun/index.ts";
import { useProfileData } from "./hooks/useProfileData.ts";
import { useRunStats } from "./hooks/useRunStats.ts";

export function App() {
  const { profile, loading, error } = useProfileData();
  const { sortedRuns, stats, visitedCountries } = useRunStats(profile);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState title="Error loading data" message={error} />;
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
        <ThemeToggle />
      </Group>
      <Text c="dimmed" mb="sm">
        {[
          athlete.homeRun && `Home: ${getShortNameByLongName(athlete.homeRun) ?? athlete.homeRun}`,
          athlete.clubName && athlete.clubName !== "Unattached" && `Club: ${athlete.clubName}`,
        ].filter(Boolean).join(" | ") || "—"}
      </Text>

      {visitedCountries.length > 0 && (
        <Group gap="xs" mb="xl">
          {visitedCountries.map((iso) => (
            <CountryFlag key={iso} countryCode={iso} size={18} title={getCountryNameByISO(iso) ?? iso} />
          ))}
        </Group>
      )}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} mb="xl">
        <StatsCard 
          label="Runs" 
          value={stats.totalRuns} 
          secondary={`${stats.uniqueEvents} events`}
        />
        <StatsCard 
          label="Fastest" 
          value={formatTime(stats.fastestTime)} 
          secondary={formatPace(stats.fastestTime)}
        />
        <StatsCard 
          label="Last 5 Median" 
          value={formatTime(stats.recentMedianTime)}
          secondary={formatPace(stats.recentMedianTime)}
        />
        <StatsCard
          label="Best Age Grade"
          value={`${stats.bestAgeGrade.toFixed(1)}%`}
          secondary={stats.bestAgeGradeCategory}
        />
        <StatsCard 
          label="Best Top %" 
          value={`Top ${Math.round(stats.bestTopPercent)}%`}
          secondary={stats.bestTopPercentRun ? `${stats.bestTopPercentRun.position}\u00A0/\u00A0${stats.bestTopPercentRun.totalFinishers}` : undefined}
        />
        <StatsCard 
          label="Streak" 
          value={`${stats.streak.current} weeks`}
          secondary={`Best: ${stats.streak.best}`}
        />
      </SimpleGrid>

      <ResponsiveRuns runs={sortedRuns} />

      <ChartCard title="Events Visited">
        <EventsMap runs={sortedRuns} height={400} />
      </ChartCard>

      <ChartCard title="Consistency Calendar">
        <ResponsiveCalendar runs={sortedRuns} />
      </ChartCard>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
        <ResponsiveChartCard title="Finish Time Over Time">
          {(width) => <FinishTimeChart runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="PB Progression">
          {(width) => <PBProgressionChart runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="Age Grade Over Time">
          {(width) => <AgeGradeChart runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>

        <ResponsiveChartCard title="Finish Time Distribution">
          {(width) => <FinishTimeDistribution runs={sortedRuns} width={width} height={280} />}
        </ResponsiveChartCard>
      </SimpleGrid>

      <Text size="xs" c="dimmed" ta="center" mt="xl">
        Last updated: {new Date(profile.generatedAt).toLocaleString()}
      </Text>
    </Container>
  );
}
