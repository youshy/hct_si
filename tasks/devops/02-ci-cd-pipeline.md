# Task: CI/CD Pipeline Setup

## Overview
Set up automatic deployment so every push to main deploys the latest code. This eliminates manual deployment steps and ensures the live URL is always up to date.

## Required Outcome
- Push to `main` branch triggers automatic deployment
- Frontend deploys to Vercel/Netlify
- Backend API deploys to Vercel/Cloudflare
- Live URLs available within minutes of push
- Build failures notify the team

## Prerequisites
- GitHub repository created (Task 01)
- Vercel/Cloudflare account created
- Project linked to deployment platform

## Time Estimate
Hour 1-2 of the hackathon (15-20 minutes)

---

## Step-by-Step Implementation

### Option A: Vercel (Recommended for Hackathon)

Vercel auto-detects most frameworks and requires minimal configuration.

#### Step 1: Connect Repository to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (run from project root)
vercel link
```

**Or via Vercel Dashboard:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import Git Repository
3. Select your GitHub repo
4. Vercel auto-detects Vite/Svelte/React

#### Step 2: Configure Build Settings

**For Monorepo (frontend in `/frontend`):**

In Vercel Dashboard > Settings > General:
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

**File:** `vercel.json` (in project root)
```json
{
  "buildCommand": "cd frontend/hackathon-sales-intelligence && npm run build",
  "outputDirectory": "frontend/hackathon-sales-intelligence/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

#### Step 3: Enable Auto-Deployments

Vercel automatically deploys on push. Verify in:
- Settings > Git > Production Branch: `main`
- Settings > Git > Auto-Deploy: Enabled

#### Step 4: Get Production URLs

After first deployment:
- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/...`

---

### Option B: Cloudflare Pages + Workers

#### Step 1: Connect to Cloudflare Pages

1. Go to Cloudflare Dashboard > Pages
2. Create a project > Connect to Git
3. Select your repository
4. Configure build:
   - Build command: `cd frontend/hackathon-sales-intelligence && npm run build`
   - Build output: `frontend/hackathon-sales-intelligence/dist`

#### Step 2: Set Up Workers for API

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Initialize worker (in api folder)
cd api
wrangler init
```

**File:** `api/wrangler.toml`
```toml
name = "deal-tracker-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
# Non-secret variables here

# Secrets set via: wrangler secret put SECRET_NAME
```

#### Step 3: Deploy Worker

```bash
wrangler deploy
```

---

### Option C: GitHub Actions (Manual Control)

**File:** `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd frontend/hackathon-sales-intelligence && npm ci

      - name: Build
        run: cd frontend/hackathon-sales-intelligence && npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Quick Setup Checklist

### Vercel (5 minutes)
```bash
# 1. Install and login
npm i -g vercel && vercel login

# 2. Deploy (from project root)
vercel

# 3. Set production
vercel --prod

# Done! Auto-deploy enabled by default
```

### Verify Deployment
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Check production URL
curl https://your-project.vercel.app/api/health
```

---

## Environment Variables in CI/CD

### Vercel Dashboard
1. Go to Project Settings > Environment Variables
2. Add each variable:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. Select environments: Production, Preview, Development

### Via CLI
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

---

## Acceptance Criteria

- [x] Repository connected to deployment platform
- [x] Push to `main` triggers automatic deployment
- [x] Frontend builds successfully
- [x] API functions deploy successfully
- [x] Production URLs are accessible
- [x] Environment variables configured
- [x] Build logs accessible for debugging
- [x] Team can see deployment status

---

## Deployment URLs Template

Document these for the team:

```
Production:
- Frontend: https://[project].vercel.app
- API Base: https://[project].vercel.app/api

Preview (per PR):
- Frontend: https://[project]-[branch].vercel.app
- API: https://[project]-[branch].vercel.app/api

Local Development:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
```

---

## Troubleshooting Deployments

### Build Fails
```bash
# Check build logs
vercel logs --follow

# Common issues:
# - Missing dependencies: Check package.json
# - TypeScript errors: Run `npm run build` locally first
# - Wrong Node version: Add "engines" to package.json
```

### API Not Working
```bash
# Check function logs
vercel logs production

# Test endpoint
curl -v https://your-project.vercel.app/api/health
```

### Environment Variables Missing
```bash
# List env vars
vercel env ls

# Pull to local
vercel env pull
```

---

## Slack/Discord Notifications (Optional)

**File:** `.github/workflows/notify.yml`
```yaml
name: Notify on Deploy

on:
  deployment_status:

jobs:
  notify:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployed to ${{ github.event.deployment_status.environment_url }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```
