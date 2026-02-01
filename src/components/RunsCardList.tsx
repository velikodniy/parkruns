import { useMemo, useState } from "react";
import { Box, Card, Group, Pagination, Stack, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { RunCard } from "./RunCard.tsx";
import { computeAllTimePBs } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

const PAGE_SIZE = 10;

export function RunsCardList({ runs }: Props) {
  const [activePage, setPage] = useState(1);
  const totalPages = Math.ceil(runs.length / PAGE_SIZE);

  const allTimePBs = useMemo(() => computeAllTimePBs(runs), [runs]);

  const displayedRuns = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return runs.slice(start, start + PAGE_SIZE);
  }, [runs, activePage]);

  return (
    <Card withBorder>
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>All Runs</Title>
        <Pagination
          total={totalPages}
          value={activePage}
          onChange={setPage}
          size="sm"
          radius="md"
          siblings={1}
          boundaries={1}
        >
          <Group gap={5} wrap="nowrap">
            <Pagination.Previous />
            <Box visibleFrom="xs">
              <Pagination.Items />
            </Box>
            <Box hiddenFrom="xs">
              <Pagination.Control>
                {activePage}
              </Pagination.Control>
            </Box>
            <Pagination.Next />
          </Group>
        </Pagination>
      </Group>

      <Stack gap="sm">
        {displayedRuns.map((run: Run, index: number) => {
          const globalIndex = (activePage - 1) * PAGE_SIZE + index;
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
