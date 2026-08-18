import { Card, Group, Stack, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { RunCard } from "./RunCard.tsx";
import { PaginationControls } from "./PaginationControls.tsx";
import { useRunsList, type UseRunsListResult } from "../hooks/useRunsList.ts";
import { runKey } from "./run-utils.ts";

interface Props {
  runs?: Run[];
  runsList?: UseRunsListResult;
  medalRanks: Map<string, number>;
}

export function RunsCardList({ runs, runsList, medalRanks }: Props) {
  const internalList = useRunsList(runs ?? []);
  const { items, pagination, totalPages, rangeText } = runsList ?? internalList;

  const controls = (
    <PaginationControls
      rangeText={rangeText}
      total={totalPages}
      value={pagination.active}
      onChange={pagination.setPage}
    />
  );

  return (
    <Card withBorder>
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>All Runs</Title>
        {controls}
      </Group>

      <Stack gap="sm">
        {items.map(({ run, previousRun }) => (
          <RunCard
            key={runKey(run)}
            run={run}
            medalRank={medalRanks.get(runKey(run))}
            previousAgeGrade={previousRun?.ageGrade ?? null}
          />
        ))}
      </Stack>

      <Group justify="flex-end" mt="md">
        {controls}
      </Group>
    </Card>
  );
}
