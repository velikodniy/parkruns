import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { App } from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { type ColorScheme, ThemeProvider } from "./context/ThemeContext.tsx";
import { THEME_STORAGE_KEY } from "./theme.ts";

function getInitialColorScheme(): ColorScheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored === "light" || stored === "dark") ? stored : "dark";
}

const initialScheme = getInitialColorScheme();

const root = createRoot(document.getElementById("root")!);
root.render(
  <MantineProvider defaultColorScheme={initialScheme}>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </MantineProvider>,
);
