import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { type Profile, ProfileSchema, type Run } from "./types.ts";
import {
  AgeGradeChart,
  ConsistencyCalendar,
  FinishTimeChart,
  FinishTimeDistribution,
  PBProgressionChart,
} from "./components/index.ts";
import { formatTime } from "./format.ts";

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

  if (runs.length === 0) {
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

  const totalRuns = runs.length;
  const pbCount = runs.filter((r: Run) => r.wasPB).length;
  const fastestRun = runs.reduce((a: Run, b: Run) =>
    a.finishTimeSeconds < b.finishTimeSeconds ? a : b
  );
  const avgTime = Math.round(
    runs.reduce((sum: number, r: Run) => sum + r.finishTimeSeconds, 0) /
      totalRuns,
  );

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xs">
        {athlete.fullName}
      </Title>
      <Text c="dimmed" mb="xl">
        {athlete.homeRun && `Home: ${athlete.homeRun}`}
        {athlete.clubName && ` | Club: ${athlete.clubName}`}
      </Text>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <StatsCard label="Total Runs" value={totalRuns} />
        <StatsCard label="PBs" value={pbCount} />
        <StatsCard
          label="Fastest"
          value={formatTime(fastestRun.finishTimeSeconds)}
        />
        <StatsCard label="Average Time" value={formatTime(avgTime)} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <StatsCard
          label="Best Age Grade"
          value={`${Math.max(...runs.map((r: Run) => r.ageGrade)).toFixed(1)}%`}
        />
        <StatsCard
          label="Best Position"
          value={Math.min(...runs.map((r: Run) => r.position))}
        />
        <StatsCard
          label="Latest Run"
          value={new Date(runs[0].eventDate).toLocaleDateString()}
        />
        <StatsCard
          label="Events Visited"
          value={new Set(runs.map((r: Run) => r.eventName)).size}
        />
      </SimpleGrid>

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

      <ChartCard title="Consistency Calendar">
        <ConsistencyCalendar runs={runs} />
      </ChartCard>

      <Card withBorder>
        <Title order={3} mb="md">
          All Runs
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Event</Table.Th>
              <Table.Th>Time</Table.Th>
              <Table.Th>Pos</Table.Th>
              <Table.Th>Age Grade</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runs.map((run: Run) => (
              <Table.Tr key={`${run.eventDate}-${run.eventId}`}>
                <Table.Td>{run.runNumber}</Table.Td>
                <Table.Td>
                  {new Date(run.eventDate).toLocaleDateString()}
                </Table.Td>
                <Table.Td>{run.eventName}</Table.Td>
                <Table.Td>{run.finishTime}</Table.Td>
                <Table.Td>{run.position}</Table.Td>
                <Table.Td>{run.ageGrade.toFixed(1)}%</Table.Td>
                <Table.Td>
                  {run.wasPB && (
                    <Badge color="green" size="sm">
                      PB
                    </Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Text size="xs" c="dimmed" ta="center" mt="xl">
        Last updated: {new Date(profile.generatedAt).toLocaleString()}
      </Text>
    </Container>
  );
}
