import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useMantineColorScheme } from "@mantine/core";
import { THEME_STORAGE_KEY } from "../theme.ts";

export type ColorScheme = "light" | "dark";

interface AgeGradeTiers {
  worldClass: string;
  nationalClass: string;
  regionalClass: string;
  localClass: string;
}

interface MedalColors {
  gold: string;
  silver: string;
  bronze: string;
}

export interface ChartColors {
  primary: string;
  success: string;
  warning: string;
  axis: string;
  background: string;
  border: string;
  text: string;
  box: string;
  boxStroke: string;
  inactive: string;
  skipped: string;
  ageGrade: AgeGradeTiers;
  medal: MedalColors;
}

const darkChartColors: ChartColors = {
  primary: "#228be6",
  success: "#40c057",
  warning: "#fab005",
  axis: "#888",
  background: "#1a1b1e",
  border: "#373a40",
  text: "#c1c2c5",
  box: "#364fc7",
  boxStroke: "#4c6ef5",
  inactive: "#2c2e33",
  skipped: "#fa5252", // Brighter red for dark mode to match the green
  ageGrade: {
    worldClass: "#ae3ec9",
    nationalClass: "#40c057",
    regionalClass: "#fab005",
    localClass: "#ff6b6b",
  },
  medal: {
    gold: "#ffd43b",
    silver: "#ced4da",
    bronze: "#e8845e",
  },
};

const lightChartColors: ChartColors = {
  primary: "#1971c2",
  success: "#2f9e44",
  warning: "#f08c00",
  axis: "#495057",
  background: "#ffffff",
  border: "#dee2e6",
  text: "#212529",
  box: "#4263eb",
  boxStroke: "#5c7cfa",
  inactive: "#e9ecef",
  skipped: "#ff6b6b",
  ageGrade: {
    worldClass: "#9c36b5",
    nationalClass: "#2f9e44",
    regionalClass: "#f08c00",
    localClass: "#e03131",
  },
  medal: {
    gold: "#d4af37",
    silver: "#868e96",
    bronze: "#b06a2c",
  },
};

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: ChartColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useChartTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useChartTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  // Normalize "auto" to actual scheme (fallback to dark)
  const resolvedScheme: ColorScheme = colorScheme === "light"
    ? "light"
    : "dark";

  const colors = useMemo(
    () => (resolvedScheme === "dark" ? darkChartColors : lightChartColors),
    [resolvedScheme],
  );

  const toggle = useCallback(() => {
    const next: ColorScheme = resolvedScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (_e) {
      // ignore
    }
  }, [resolvedScheme, setColorScheme]);

  const value = useMemo(
    () => ({ colorScheme: resolvedScheme, colors, toggle }),
    [resolvedScheme, colors, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
