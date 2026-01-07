import { useMemo } from "react";
import { Card, Stack, Title } from "@mantine/core";
import type { Run } from "../types.ts";
import { RunCard } from "./RunCard.tsx";
import { computeAllTimePBs } from "./run-utils.ts";

interface Props {
  runs: Run[];
}

export function RunsCardList({ runs }: Props) {
  const allTimePBs = useMemo(() => computeAllTimePBs(runs), [runs]);

  return (
    <Card withBorder>
      <Title order={3} mb="md">
        All Runs
      </Title>
      <Stack gap="sm">
        {runs.map((run: Run, index: number) => {
          const previousRun = index < runs.length - 1 ? runs[index + 1] : null;
          const previousAgeGrade = previousRun?.ageGrade ?? null;
          const isAllTimePB = allTimePBs[index];

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
