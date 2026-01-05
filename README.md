# Parkrun Profile

Static dashboard displaying parkrun results. Data fetched weekly via GitHub
Actions.

## Setup

```bash
# Development
deno task dev

# Build
deno task build

# Download data
PARKRUN_ATHLETE_ID=Axxxxx PARKRUN_PASSWORD=xxx deno task download
```

## Deployment

1. Add GitHub secrets: `PARKRUN_ATHLETE_ID`, `PARKRUN_PASSWORD`
2. Enable GitHub Pages (source: Actions)
3. Push to `main`

Workflow runs on push and every Saturday at 12:00 UTC.
