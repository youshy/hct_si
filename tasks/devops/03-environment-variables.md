# Task: Environment Variables Configuration

## Overview
Set up all required environment variables across local development, staging, and production environments. Proper configuration ensures the app can connect to Supabase and Gemini AI services.

## Required Outcome
- All required secrets configured in deployment platform
- Local `.env` files set up for development
- Environment variables documented for team
- Secrets are not committed to git

## Prerequisites
- Supabase project created (credentials available)
- Gemini API key obtained
- Vercel/Cloudflare project connected

## Time Estimate
Hour 2-3 of the hackathon (10-15 minutes)

---

## Required Environment Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | Backend API |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Backend API |
| `GEMINI_API_KEY` | Google Gemini API key | Sentiment endpoint |
| `VITE_API_URL` | API base URL | Frontend (optional) |

---

## Step-by-Step Implementation

### Step 1: Gather Credentials

**Supabase:**
1. Go to [supabase.com](https://supabase.com) > Your Project
2. Settings > API
3. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key: `eyJhbGc...`

**Gemini:**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Configure Local Development

**File:** `api/.env` (for backend)
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIza...
```

**File:** `frontend/hackathon-sales-intelligence/.env` (for frontend)
```bash
# Only needed if API is on different domain
VITE_API_URL=http://localhost:3000
```

**IMPORTANT:** Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### Step 3: Configure Vercel (Production)

**Option A: Via CLI**
```bash
# Add each variable
vercel env add SUPABASE_URL
# Enter value when prompted, select Production

vercel env add SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

**Option B: Via Dashboard**
1. Go to Vercel > Your Project > Settings
2. Environment Variables
3. Add each variable:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIza...` | Production, Preview, Development |

4. Click "Save"

### Step 4: Configure Cloudflare (Alternative)

```bash
# Add secrets to Workers
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put GEMINI_API_KEY
```

### Step 5: Verify Configuration

**Check Vercel:**
```bash
vercel env ls
```

**Test locally:**
```bash
# Pull env from Vercel to local
vercel env pull

# Or test directly
cd api
node -e "console.log(process.env.SUPABASE_URL)"
```

**Test deployed:**
```bash
curl https://your-project.vercel.app/api/health
# Should return {"status":"healthy","database":"connected",...}
```

---

## Environment Variable Usage in Code

### Backend (Node.js/Edge)
```typescript
// api/lib/supabase.ts
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables not configured');
}
```

### Frontend (Vite)
```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || '';

// In production, API is on same domain, so empty string works
export async function fetchDeals() {
  const response = await fetch(`${API_URL}/api/deals`);
  return response.json();
}
```

---

## Team Documentation

Create a shared document (NOT in git) with credentials:

```markdown
# Sales Deal Tracker - Environment Variables

## Supabase
- URL: https://xxxxx.supabase.co
- Anon Key: eyJhbG... (first 20 chars shown)
- Dashboard: https://supabase.com/dashboard/project/xxxxx

## Gemini
- API Key: AIza... (first 10 chars shown)
- Dashboard: https://aistudio.google.com

## Vercel
- Project URL: https://sales-deal-tracker.vercel.app
- Dashboard: https://vercel.com/team/sales-deal-tracker

## Local Setup
Copy these to your .env files:

api/.env:
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

**Share via:**
- Team Slack channel (pinned message)
- 1Password/shared vault
- Notion private page

---

## Acceptance Criteria

- [x] Supabase URL and key configured in Vercel
- [x] Gemini API key configured in Vercel
- [x] Local `.env` files created for development
- [x] `.env` files are gitignored
- [x] Health check endpoint returns "healthy"
- [x] Sentiment endpoint works (uses Gemini key)
- [x] Team has access to credentials (securely shared)
- [x] No secrets in git history

---

## Security Checklist

- [x] Never commit `.env` files
- [x] Never log environment variables
- [x] Use `anon` key (not `service_role`) for Supabase
- [x] Rotate keys if accidentally exposed
- [x] Use different keys for dev vs production (if time permits)

---

## Troubleshooting

### "Environment variable not found"
```bash
# Check it's set in Vercel
vercel env ls

# Redeploy to pick up new vars
vercel --prod
```

### "Invalid API key" from Supabase
- Verify URL matches project
- Check key is the `anon public` key, not `service_role`
- Ensure no extra whitespace in value

### "Invalid API key" from Gemini
- Check key starts with `AIza`
- Verify key is active at aistudio.google.com
- Check rate limits (free tier: 15 RPM)

### Local works, production doesn't
```bash
# Pull production env locally
vercel env pull .env.production.local

# Compare with local
diff .env .env.production.local
```

---

## Quick Reference Card

```bash
# Add env var to Vercel
vercel env add VAR_NAME

# List env vars
vercel env ls

# Pull env to local
vercel env pull

# Remove env var
vercel env rm VAR_NAME

# Cloudflare secrets
wrangler secret put SECRET_NAME
wrangler secret list
```
