import { useMemo } from "react";
import { Card, Group, Pagination, Stack, Text, Title } from "@mantine/core";
import { usePagination } from "@mantine/hooks";
import type { Run } from "../types.ts";
import { RunCard } from "./RunCard.tsx";
import { computeAllTimePBs } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

const PAGE_SIZE = 10;

export function RunsCardList({ runs }: Props) {
  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pagination = usePagination({
    total: totalPages,
    initialPage: 1,
  });

  const allTimePBs = useMemo(() => computeAllTimePBs(runs), [runs]);

  const displayedRuns = useMemo(() => {
    const start = (pagination.active - 1) * PAGE_SIZE;
    return runs.slice(start, start + PAGE_SIZE);
  }, [runs, pagination.active]);

  const startIdx = (pagination.active - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(pagination.active * PAGE_SIZE, runs.length);
  const rangeText = runs.length > 0
    ? `${startIdx}–${endIdx} of ${runs.length}`
    : "0 runs";

  return (
    <Card withBorder>
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>All Runs</Title>
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" fw={500} style={{ whiteSpace: "nowrap" }}>
            {rangeText}
          </Text>
          <Pagination
            total={totalPages}
            value={pagination.active}
            onChange={pagination.setPage}
            size="sm"
            withPages={false}
          />
        </Group>
      </Group>

      <Stack gap="sm">
        {displayedRuns.map((run: Run, index: number) => {
          const globalIndex = (pagination.active - 1) * PAGE_SIZE + index;
          const previousRun = globalIndex < runs.length - 1
            ? runs[globalIndex + 1]
            : null;
          const previousAgeGrade = previousRun?.ageGrade ?? null;
          const isAllTimePB = allTimePBs[globalIndex];

          return (
            <RunCard
              key={`${run.eventDate}-${run.eventId}`}
              run={run}
              isAllTimePB={isAllTimePB}
              previousAgeGrade={previousAgeGrade}
            />
          );
        })}
      </Stack>
    </Card>
  );
}
