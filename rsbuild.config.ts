import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "node:fs";

const themeInitScript = `
(function() {
  var key = 'parkrun-color-scheme';
  var stored = localStorage.getItem(key);
  var scheme = stored || 'dark';
  document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
})();
`;

let athleteName = "";
try {
  const data = JSON.parse(fs.readFileSync("./public/data.json", "utf-8"));
  athleteName = data.athlete.fullName;
} catch (e) {
  console.warn("Could not read athlete name from data.json", e);
}

const pageTitle = athleteName
  ? `${athleteName} — Parkrun Profile`
  : "Parkrun Profile";

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
    title: pageTitle,
    meta: {
      description:
        "Track your parkrun results, statistics, and personal records",
      robots: "index, follow",
      "og:title": {
        property: "og:title",
        content: pageTitle,
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
        content: pageTitle,
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
