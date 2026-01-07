import { useMemo } from "react";
import { Box, Group, Stack, Text } from "@mantine/core";
import type { Run } from "../types.ts";

interface Props {
  runs: Run[];
}

interface MonthData {
  year: number;
  month: number;
  label: string;
  count: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getBarColor(count: number): string {
  if (count === 0) return "#dee2e6";
  if (count === 1) return "#69db7c";
  if (count === 2) return "#40c057";
  return "#2f9e44";
}

export function MonthlySummary({ runs }: Props) {
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    for (const run of runs) {
      const date = new Date(run.eventDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }

    const result: MonthData[] = [];
    const now = new Date();
    const startDate = runs.length > 0 
      ? new Date(Math.min(...runs.map(r => new Date(r.eventDate).getTime())))
      : now;
    
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    for (let y = endYear; y >= startYear; y--) {
      const monthStart = (y === endYear) ? endMonth : 11;
      const monthEnd = (y === startYear) ? startMonth : 0;
      
      for (let m = monthStart; m >= monthEnd; m--) {
        const key = `${y}-${m}`;
        const count = monthMap.get(key) ?? 0;
        result.push({
          year: y,
          month: m,
          label: `${MONTH_NAMES[m]} ${y}`,
          count,
        });
      }
    }

    return result;
  }, [runs]);

  const maxCount = useMemo(() => Math.max(...monthlyData.map(d => d.count), 1), [monthlyData]);

  return (
    <Stack gap={4}>
      {monthlyData.map((data) => (
        <Group 
          key={`${data.year}-${data.month}`} 
          gap="xs" 
          wrap="nowrap"
          style={{ minHeight: 28 }}
        >
          <Text size="xs" c="dimmed" style={{ width: 70, flexShrink: 0 }}>
            {data.label}
          </Text>
          <Box style={{ flex: 1, position: "relative", height: 20 }}>
            <Box
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: data.count > 0 ? `${(data.count / maxCount) * 100}%` : 0,
                minWidth: data.count > 0 ? 4 : 0,
                backgroundColor: getBarColor(data.count),
                borderRadius: 2,
              }}
            />
          </Box>
          <Text 
            size="xs" 
            fw={data.count > 0 ? 500 : 400}
            c={data.count > 0 ? undefined : "dimmed"}
            style={{ width: 20, textAlign: "right", flexShrink: 0 }}
          >
            {data.count}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
