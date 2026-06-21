import { Group, Pagination, Text } from "@mantine/core";

interface Props {
  /** Range summary, e.g. "1–10 of 42". */
  rangeText: string;
  total: number;
  value: number;
  onChange: (page: number) => void;
}

/** Range text plus a compact page selector, shared by the runs list views. */
export function PaginationControls(
  { rangeText, total, value, onChange }: Props,
) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="xs" c="dimmed" fw={500} style={{ whiteSpace: "nowrap" }}>
        {rangeText}
      </Text>
      <Pagination
        total={total}
        value={value}
        onChange={onChange}
        withPages={false}
        size="sm"
      />
    </Group>
  );
}
