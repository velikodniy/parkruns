# Parkrun Profile

Static dashboard displaying your parkrun results. Data refreshed weekly via GitHub Actions, hosted on Deno Deploy.

## Fork & Deploy

### Prerequisites

- [Deno](https://deno.land/) (`curl -fsSL https://deno.land/install.sh | sh`)
- [GitHub CLI](https://cli.github.com/) (`brew install gh` or see docs)
- Your parkrun athlete ID (e.g., `A1234567`) and password

### Steps

1. **Fork & clone**
   ```bash
   gh repo fork velikodniy/parkruns --clone
   cd parkruns
   ```

2. **Add GitHub secrets**
   ```bash
   gh secret set PARKRUN_ATHLETE_ID
   gh secret set PARKRUN_PASSWORD
   gh secret set DENO_DEPLOY_TOKEN
   ```
   Get your Deno Deploy token at https://console.deno.com → Account Settings → Access Tokens

3. **Create Deno Deploy app**
   - Go to https://console.deno.com
   - Create new organization (or use existing)
   - Create new app named `parkruns` (or your choice)
   - Set runtime to **Static**, directory `/`, enable SPA mode

4. **Update workflow** (if you changed app/org name)
   
   Edit `.github/workflows/deploy.yml`:
   ```yaml
   run: deno deploy --org YOUR_ORG --app YOUR_APP --prod --no-wait dist
   ```

5. **Trigger deploy**
   ```bash
   gh workflow run deploy.yml
   ```

Your dashboard will be available at `https://YOUR_APP.deno.dev`

## Local Development

```bash
deno task dev                    # Dev server
deno task build                  # Build static site
PARKRUN_ATHLETE_ID=Axxxxx PARKRUN_PASSWORD=xxx deno task download  # Fetch data
```

## How It Works

- GitHub Actions runs weekly (Saturdays 12:00 UTC) or on manual trigger
- Downloads your results from parkrun API
- Builds static React dashboard
- Deploys to Deno Deploy
