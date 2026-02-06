# Quick Start Guide

Get your Co-Working Dashboard running in 5 minutes!

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
cd /Users/David/co-working-dashboard

# Create GitHub repo at: https://github.com/new
# Name: co-working-dashboard

# Add remote and push
git remote add origin https://github.com/davidwischnewski31-coder/co-working-dashboard.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `co-working-dashboard` repository
3. Click "Deploy" (don't add env vars yet)

### Step 3: Add Database
1. In Vercel project → Storage tab
2. Click "Create Database" → Select "Postgres"
3. Click "Create"
4. Copy the `DATABASE_URL` from connection string

### Step 4: Add Environment Variables
1. Settings → Environment Variables
2. Add:
   - `DATABASE_URL`: (paste from step 3)
3. Redeploy (Deployments tab → latest → ⋯ → Redeploy)

### Step 5: Run Migrations
1. In Vercel → Storage → Your Database → Query tab
2. Copy contents of `migrations/001_init.sql` from repo
3. Paste and click "Run Query"

### Step 6: Test It!
1. Visit your Vercel URL
2. Go to Projects → Click "Sync Projects"
3. Should sync 17 projects from davidai

**Done!** 🎉

---

## Option 2: Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Steps
```bash
cd /Users/David/co-working-dashboard

# 1. Install dependencies
npm install

# 2. Create database
createdb coworking

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local - set DATABASE_URL to postgresql://localhost:5432/coworking

# 4. Run migrations
npm run migrate

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

---

## First Time Using the Dashboard

1. **Overview Page**: See stats for tasks, projects, ideas, articles
2. **Kanban Board**: Click "New Task" → drag between columns
3. **Projects**: Click "Sync Projects" → imports from davidai
4. **Ideas**: Add ideas → progress from brainstorm → shipped
5. **Reading**: Create lists → add article URLs
6. **Activity**: See timeline of all human and AI actions

## Human vs AI Attribution

Every task shows who created it:
- 👤 **Human badge** (blue): Actions by David
- 🤖 **Agent badge** (purple): Actions by AI agents
  - Shows model name (e.g., "claude-sonnet-4.5")
  - Tracks tokens used

Create tasks as different agents to see attribution in action!

## Next Steps

- [ ] Sync projects from davidai
- [ ] Create your first task
- [ ] Add an idea
- [ ] Set up a reading list
- [ ] Check the activity log

## Need Help?

See `DEPLOYMENT.md` for detailed deployment instructions or `README.md` for full documentation.
