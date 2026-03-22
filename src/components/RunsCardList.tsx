import { useMemo } from "react";
import { Card, Group, Pagination, Stack, Text, Title } from "@mantine/core";
import { usePagination } from "@mantine/hooks";
import type { Run } from "../types.ts";
import { RunCard } from "./RunCard.tsx";
import { computeAllTimePBs, runKey } from "./run-utils.ts";

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

  const pbRuns = useMemo(() => computeAllTimePBs(runs), [runs]);

  const pageStart = (pagination.active - 1) * PAGE_SIZE;
  const displayedRuns = useMemo(() => {
    return runs.slice(pageStart, pageStart + PAGE_SIZE);
  }, [runs, pageStart]);

  const endIdx = Math.min(pagination.active * PAGE_SIZE, runs.length);
  const rangeText = runs.length > 0
    ? `${pageStart + 1}–${endIdx} of ${runs.length}`
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
          const globalIndex = pageStart + index;
          const previousRun = globalIndex < runs.length - 1
            ? runs[globalIndex + 1]
            : null;

          return (
            <RunCard
              key={runKey(run)}
              run={run}
              isAllTimePB={pbRuns.has(runKey(run))}
              previousAgeGrade={previousRun?.ageGrade ?? null}
            />
          );
        })}
      </Stack>
    </Card>
  );
}
