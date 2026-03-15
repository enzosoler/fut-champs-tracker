# FUT Champs Tracker FC 26 — Setup Guide

## Stack
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend/DB/Auth:** Supabase
- **Deploy:** Vercel

---

## Step 1 — Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project (name it "fut-champs-tracker")
3. Go to **SQL Editor → New Query**, paste the contents of `supabase_setup.sql`, and click **Run**
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Authentication → URL Configuration** and set:
   - Site URL: `http://localhost:3000` (for dev), your Vercel URL (for prod)

---

## Step 2 — Local Development

```bash
# 1. Install Node.js (https://nodejs.org) — use the LTS version

# 2. Create the Next.js project
npx create-next-app@latest fut-champs-tracker
# Options: TypeScript ✓, ESLint ✓, Tailwind CSS ✓, App Router ✓

# 3. Replace the generated files with the ones from this zip

# 4. Install extra dependencies
cd fut-champs-tracker
npm install @supabase/supabase-js date-fns lucide-react react-hook-form recharts

# 5. Create your env file
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and key

# 6. Run the dev server
npm run dev
# Open http://localhost:3000
```

---

## Step 3 — Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "feat: initial FUT Champs Tracker"
git push origin main
```

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy** — done! 🚀

---

## Features
- 🔐 Magic link auth (no password needed)
- 📊 Win % trend chart
- 🏆 Rank tier estimation (Bronze → Elite I)
- ➕ Log wins/losses with score + notes
- 📋 Full match history with filters
- 🗑️ Delete matches
- 📱 Mobile-first design
