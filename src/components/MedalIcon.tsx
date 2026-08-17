import type { CSSProperties } from "react";

const MEDALS = ["🥇", "🥈", "🥉"];
const LABELS = ["Fastest time", "Second-fastest time", "Third-fastest time"];
const HIGHLIGHT_COLORS = [
  "var(--mantine-color-yellow-6)",
  "var(--mantine-color-gray-5)",
  "var(--mantine-color-orange-6)",
];

interface Props {
  rank: number;
}

export function getMedalHighlightStyle(
  rank?: number,
): CSSProperties | undefined {
  if (!rank) return undefined;
  const color = HIGHLIGHT_COLORS[rank - 1];
  if (!color) return undefined;

  return {
    boxShadow: `inset 3px 0 0 ${color}`,
  };
}

export function MedalIcon({ rank }: Props) {
  const medal = MEDALS[rank - 1];
  const label = LABELS[rank - 1];
  if (!medal || !label) return null;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ flexShrink: 0, lineHeight: 1 }}
    >
      {medal}
    </span>
  );
}
