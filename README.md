# Parkrun Profile

Static dashboard displaying parkrun results with D3.js visualizations. Data
refreshed weekly via GitHub Actions, hosted on Deno Deploy.

> [!WARNING]
> This project uses an unofficial, reverse-engineered parkrun API. It is NOT
> affiliated with, endorsed by, or connected to parkrun Limited. Use at your own
> risk.

## Local Development

```bash
deno task dev      # Dev server (no env vars needed)
deno task build    # Build static site (no env vars needed)
deno task download # Fetch data (requires env vars below)
```

### Fetching Data

Create a `.env` file (gitignored):

```env
PARKRUN_ATHLETE_ID=Axxxxx
PARKRUN_PASSWORD=xxx
PARKRUN_CLIENT_ID=xxx
PARKRUN_CLIENT_SECRET=xxx
```

Then run `deno task download` to fetch your parkrun results.

## How It Works

- GitHub Actions runs weekly (Saturdays 12:00 UTC) or on manual trigger
- Downloads results from parkrun API
- Builds static React dashboard
- Deploys to Deno Deploy

**Note:** The API credentials are only used during data download. They are NOT
bundled into the static website.
