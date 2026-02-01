import { ActionIcon } from "@mantine/core";
import { useChartTheme } from "../context/ThemeContext.tsx";
import { IconMoon, IconSun } from "./ThemeIcons.tsx";

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
