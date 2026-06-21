import { Badge } from "@mantine/core";

interface Props {
  wasPb: boolean;
  /** Whether this run is an all-time PB (vs. a same-event PB at the time). */
  isAllTimePB: boolean;
}

/**
 * "PB" badge: filled blue for an all-time personal best, light gray for a PB
 * that was only a best at the time. Renders nothing when the run wasn't a PB.
 */
export function PBBadge({ wasPb, isAllTimePB }: Props) {
  if (!wasPb) return null;
  return (
    <Badge
      color={isAllTimePB ? "blue" : "gray"}
      size="xs"
      variant={isAllTimePB ? "filled" : "light"}
      style={{ flexShrink: 0 }}
    >
      PB
    </Badge>
  );
}
