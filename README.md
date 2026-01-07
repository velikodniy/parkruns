# Parkrun Profile

Static dashboard displaying parkrun results with D3.js visualizations. Data refreshed weekly via GitHub Actions, hosted on Deno Deploy.

## Local Development

```bash
deno task dev                    # Dev server
deno task build                  # Build static site
```

## How It Works

- GitHub Actions runs weekly (Saturdays 12:00 UTC) or on manual trigger
- Downloads results from parkrun API
- Builds static React dashboard
- Deploys to Deno Deploy
