import { Badge, Card, Table, Title } from "@mantine/core";
import type { Run } from "../types.ts";

interface Props {
  runs: Run[];
}

export function RunsTable({ runs }: Props) {
  return (
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
  );
}
