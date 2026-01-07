import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { App } from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { THEME_STORAGE_KEY, type ColorScheme, setChartColorScheme } from "./theme.ts";

function getInitialColorScheme(): ColorScheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored === "light" || stored === "dark") ? stored : "dark";
}

const initialScheme = getInitialColorScheme();
setChartColorScheme(initialScheme);

const root = createRoot(document.getElementById("root")!);
root.render(
  <MantineProvider defaultColorScheme={initialScheme}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </MantineProvider>,
);
