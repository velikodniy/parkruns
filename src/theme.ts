export const THEME_STORAGE_KEY = "parkrun-color-scheme";

export type ColorScheme = "light" | "dark";

interface ChartColors {
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
};

let currentColorScheme: ColorScheme = "dark";

export function setChartColorScheme(scheme: ColorScheme): void {
  currentColorScheme = scheme;
}

export function getChartColors(): ChartColors {
  return currentColorScheme === "dark" ? darkChartColors : lightChartColors;
}

export const chartMargins = {
  top: 20,
  right: 30,
  bottom: 40,
  left: 50,
} as const;
