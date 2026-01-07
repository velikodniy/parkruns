import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const themeInitScript = `
(function() {
  var key = 'parkrun-color-scheme';
  var stored = localStorage.getItem(key);
  var scheme = stored || 'dark';
  document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
})();
`;

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  output: {
    assetPrefix: "./",
  },
  html: {
    title: "Parkrun Profile",
    tags: [
      {
        tag: "script",
        children: themeInitScript,
        head: true,
        append: false,
      },
    ],
  },
});
