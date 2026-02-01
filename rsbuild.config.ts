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
    meta: {
      description:
        "Track your parkrun results, statistics, and personal records",
      robots: "index, follow",
      "og:title": {
        property: "og:title",
        content: "Parkrun Profile",
      },
      "og:description": {
        property: "og:description",
        content: "Track your parkrun results, statistics, and personal records",
      },
      "og:type": {
        property: "og:type",
        content: "website",
      },
      "og:site_name": {
        property: "og:site_name",
        content: "Parkrun Profile",
      },
      "twitter:card": {
        name: "twitter:card",
        content: "summary",
      },
      "twitter:title": {
        name: "twitter:title",
        content: "Parkrun Profile",
      },
      "twitter:description": {
        name: "twitter:description",
        content: "Track your parkrun results, statistics, and personal records",
      },
    },
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
