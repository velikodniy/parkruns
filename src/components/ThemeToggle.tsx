import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { THEME_STORAGE_KEY, setChartColorScheme } from "../theme.ts";
import { IconMoon, IconSun } from "./ThemeIcons.tsx";

interface ThemeToggleProps {
  onToggle?: () => void;
}

export function ThemeToggle({ onToggle }: ThemeToggleProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggle = () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    setChartColorScheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    onToggle?.();
  };

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
