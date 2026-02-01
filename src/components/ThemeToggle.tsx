import { ActionIcon } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useChartTheme } from "../context/ThemeContext.tsx";

export function ThemeToggle() {
  const { colorScheme, toggle } = useChartTheme();

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggle}
      aria-label="Toggle color scheme"
    >
      {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
}
