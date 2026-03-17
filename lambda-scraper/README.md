# lambda-scraper/README.md
# AWS Lambda Playwright Scraper

Self-hosted replacement for Apify. Scrapes Craigslist CTO listings using Playwright + DataImpulse residential proxies, and upserts directly to Supabase.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Docker Desktop | [docker.com](https://docker.com) |
| AWS CLI | `brew install awscli` / [aws.amazon.com/cli](https://aws.amazon.com/cli) |
| Serverless Framework | `npm install -g serverless` |
| DataImpulse account | [dataimpulse.com](https://dataimpulse.com) — get residential proxy URL |

---

## Environment Variables

Set these in your shell before deploying (or in `.env` file):

```bash
export PROXY_URL="http://460bf4ae07cefeda83e4:698cdc3529344ff3@gw.dataimpulse.com:823"
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_KEY="eyJ..."   # Service role key (from Supabase Settings → API)
```

These map to:
- **Vercel .env**: `LAMBDA_SCRAPER_URL` = the API Gateway URL output after deploy
- **serverless.yml env**: `PROXY_URL`, `SUPABASE_URL`, `SUPABASE_KEY`

---

## Local Testing (Docker)

```bash
# Build the image
docker build -t pcb-scraper .

# Run locally (Lambda RIE emulator)
docker run -p 9000:8080 \
  -e PROXY_URL="http://460bf4ae07cefeda83e4:698cdc3529344ff3@gw.dataimpulse.com:823" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_KEY="$SUPABASE_SERVICE_KEY" \
  pcb-scraper

# Test in another terminal
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["losangeles"],
    "year_min": 2018,
    "year_max": 2026,
    "price_min": 5000,
    "price_max": 30000,
    "mileage_max": 130000,
    "makes": ["Toyota", "Honda"],
    "posted_today": false,
    "max_items": 20,
    "dealer_id": "00000000-0000-0000-0000-000000000000",
    "mode": "pulse"
  }'

# Expected: { "success": true, "count": N, "leads_preview": [...] }
```

---

## Deploy to AWS

```bash
# 1. Configure AWS credentials (one-time)
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# 2. Deploy (builds Docker image, pushes to ECR, creates API Gateway)
serverless deploy

# 3. Copy the endpoint URL from the output, e.g.:
#    POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/scrape
#
# 4. Add to Vercel environment variables:
#    LAMBDA_SCRAPER_URL = https://abc123.execute-api.us-east-1.amazonaws.com/dev/scrape
```

---

## Payload Reference

| Field | Type | Description |
|-------|------|-------------|
| `cities` | `string[]` | Craigslist subdomains (e.g. `["losangeles", "sfbay"]`) |
| `year_min` | `int` | Minimum vehicle year |
| `year_max` | `int` | Maximum vehicle year |
| `price_min` | `int` | Minimum price ($) |
| `price_max` | `int` | Maximum price ($) |
| `mileage_max` | `int` | Maximum mileage |
| `makes` | `string[]` | Car makes to filter (empty = all) |
| `models` | `string[]` | Car models to filter (empty = all) |
| `posted_today` | `bool` | Only show today's listings |
| `max_items` | `int` | Total listing cap (default: 200) |
| `dealer_id` | `string` | UUID from Supabase settings table |
| `mode` | `string` | `"pulse"` \| `"deep"` \| `"far_sweep"` |
| `deep_url` | `string` | Required only when `mode == "deep"` |

---

## Architecture

```
Vercel (Next.js)
  └── src/lib/scraper.ts
        ├── Budget guardrail check
        ├── Smart sleep check (active hours)
        ├── Cooldown check (pulse_interval)
        ├── City tier selection (Hot Zone / Far Sweep)
        └── POST → AWS API Gateway
                    └── Lambda (Docker)
                          ├── Playwright + Stealth
                          ├── DataImpulse Proxy
                          ├── Route aborting (~120KB/page)
                          └── Supabase upsert (external_id key)
```
