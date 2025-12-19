# Task: Project Setup & GitHub Repository

## Overview
Initialize the project structure, create the GitHub repository, and set up the basic scaffolding for both frontend and backend. This is the foundation everything else builds upon.

## Required Outcome
- GitHub repository created and accessible to team
- Frontend project initialized (Vite + Svelte/React + Tailwind)
- Backend project initialized (Vercel/Cloudflare)
- Basic project structure in place
- Team can clone and run locally

## Prerequisites
- GitHub account with repo creation access
- Node.js 18+ installed
- Vercel/Cloudflare account (for deployment)

## Time Estimate
Hour 0-1 of the hackathon (first 15-20 minutes)

---

## Step-by-Step Implementation

### Step 1: Create GitHub Repository

```bash
# Option A: Via GitHub CLI
gh repo create sales-deal-tracker --public --clone
cd sales-deal-tracker

# Option B: Via GitHub.com
# 1. Go to github.com/new
# 2. Name: sales-deal-tracker
# 3. Public or Private
# 4. Initialize with README
# 5. Clone locally
```

### Step 2: Initialize Frontend (Vite + Svelte)

```bash
# Create frontend with Vite
npm create vite@latest frontend -- --template svelte-ts
cd frontend
npm install

# Install dependencies
npm install dexie tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Alternative: React**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install dexie tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind CSS

**File:** `frontend/hackathon-sales-intelligence/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,svelte}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File:** `frontend/hackathon-sales-intelligence/src/app.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Initialize Backend (Vercel)

```bash
cd ..
mkdir api
cd api
npm init -y
npm install @supabase/supabase-js
npm install -D typescript @types/node
```

**File:** `api/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"]
}
```

### Step 5: Create Project Structure

```
hackathon-sales-intelligence/
├── README.md
├── .gitignore
├── frontend/
│   └── hackathon-sales-intelligence/
│       ├── src/
│       │   ├── lib/
│       │   │   └── db/           # IndexedDB setup
│       │   ├── components/       # UI components
│       │   ├── App.tsx           # Main app
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── backend/
│   ├── api/
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── types.ts
│   │   │   └── api-helpers.ts
│   │   ├── deals/
│   │   ├── notes/
│   │   ├── sentiment.ts
│   │   └── sync.ts
│   └── package.json
└── vercel.json (optional)
```

### Step 6: Create .gitignore

**File:** `.gitignore`
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.vercel/
.output/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### Step 7: Create Initial README

**File:** `README.md`
```markdown
# Sales Deal Tracker

Track sales deals, analyze sentiment, and understand why you're losing deals.

## Quick Start

### Frontend
```bash
cd frontend/hackathon-sales-intelligence
npm install
npm run dev
```

### Backend (Local)
```bash
cd api
npm install
vercel dev
```

## Environment Variables

Create `.env` files with:

```
# Frontend (.env)
VITE_API_URL=http://localhost:3000

# API (.env)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
GEMINI_API_KEY=your-gemini-key
```

## Team

- Frontend: [Name]
- Backend: [Name]
- DevOps: [Name]
```

### Step 8: Initial Commit & Push

```bash
git add .
git commit -m "Initial project setup"
git push origin main
```

### Step 9: Invite Team Members

```bash
# Via GitHub CLI
gh repo edit --add-collaborator teammate1
gh repo edit --add-collaborator teammate2

# Or via GitHub.com Settings > Collaborators
```

---

## Acceptance Criteria

- [x] GitHub repository created and accessible
- [x] All team members can clone the repo
- [x] Frontend runs locally (`npm run dev`)
- [x] Tailwind CSS is configured and working
- [x] Backend folder structure is in place
- [x] .gitignore covers all necessary files
- [x] README has basic setup instructions

---

## Quick Verification

```bash
# Clone and test frontend
git clone https://github.com/your-org/sales-deal-tracker.git
cd sales-deal-tracker/frontend
npm install
npm run dev
# Should see Vite dev server running

# Test Tailwind
# Add class="text-red-500" to any element
# Should turn red
```

---

## Monorepo Alternative (Simpler)

If you prefer a single package.json:

```bash
npm create vite@latest sales-deal-tracker -- --template svelte-ts
cd sales-deal-tracker
npm install dexie @supabase/supabase-js tailwindcss postcss autoprefixer

# Put API in /api folder for Vercel
mkdir api
```

Vercel will automatically detect `/api` as serverless functions.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Permission denied on clone | Check GitHub access, add SSH key |
| npm install fails | Try `npm cache clean --force` |
| Tailwind not working | Check content paths in config |
| Port 5173 in use | Use `npm run dev -- --port 3001` |
