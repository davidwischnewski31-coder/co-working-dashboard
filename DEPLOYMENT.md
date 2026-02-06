# Deployment Guide

## Quick Deploy to Vercel

### 1. Create GitHub Repository

```bash
# Add remote (already done if you forked/cloned)
git remote add origin https://github.com/davidwischnewski31-coder/co-working-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Set Up Vercel Postgres

1. Go to [vercel.com](https://vercel.com)
2. Create new project → Import from GitHub
3. Select `co-working-dashboard` repository
4. Before deploying, go to Storage tab
5. Create new Postgres database
6. Copy the connection string

### 3. Configure Environment Variables

In Vercel project settings → Environment Variables:

```
DATABASE_URL=postgres://...  (from Vercel Postgres)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Deploy

Click "Deploy" in Vercel dashboard.

### 5. Run Database Migrations

After first deployment:

**Option A: Using Vercel Postgres Dashboard**
1. Go to Storage → Your Database → Query
2. Copy contents of `migrations/001_init.sql`
3. Paste and execute

**Option B: Using Vercel CLI**
```bash
vercel env pull
npm run migrate
```

### 6. Verify Deployment

1. Visit your app URL
2. Navigate to Projects → Click "Sync Projects"
3. Should see projects from davidai imported

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup Steps

1. **Install PostgreSQL** (if not installed)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Create database
   createdb coworking
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local:
   DATABASE_URL=postgresql://localhost:5432/coworking
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run Migrations**
   ```bash
   npm run migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Browser**
   http://localhost:3000

## Post-Deployment

### Sync Projects from davidai

1. Navigate to Projects page
2. Click "Sync Projects" button
3. Verify projects appear

### Seed Initial Data (Optional)

Create some test tasks:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "owner": "David",
    "owner_type": "human",
    "status": "todo",
    "priority": "medium"
  }'
```

## Troubleshooting

### Database Connection Errors

Check DATABASE_URL format:
```
postgresql://user:password@host:port/database?sslmode=require
```

For Vercel Postgres, SSL is required.

### Migration Fails

Reset database (⚠️ deletes all data):
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then run migrations again.

### Projects Not Syncing

Ensure davidai path is correct in `lib/sync/sync-projects.ts`:
```typescript
const davidaiPath = '/Users/David/davidai'
```

This path must exist on the deployment server for sync to work.

## Monitoring

### View Logs
```bash
vercel logs
```

### Database Queries
Vercel Postgres dashboard → Query tab

### Check Activity
App → Activity page shows all human and agent actions

## Updates

To deploy updates:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel auto-deploys on push to main.
