# Vercel Postgres via Marketplace - New Setup

Vercel moved Postgres to the Marketplace. Here's how to add it:

## Step 1: Deploy Your Project First

1. Go to https://vercel.com/new
2. Import `co-working-dashboard` from GitHub
3. Click "Deploy" (it will fail - that's expected without DATABASE_URL)
4. Wait for deployment to finish

## Step 2: Add Postgres from Marketplace

### Option A: From Project Dashboard
1. In your deployed project, click **"Marketplace"** tab
2. Search for "Postgres" or look for "Vercel Postgres"
3. Click on it
4. Click "Add Integration" or "Connect"
5. Select your project (`co-working-dashboard`)
6. Click "Add"

### Option B: Direct Marketplace Link
1. Go to: https://vercel.com/marketplace
2. Search for "Postgres"
3. Click "Vercel Postgres"
4. Click "Add Integration"
5. Select your `co-working-dashboard` project
6. Authorize and create database

### Option C: Integrations Page
1. Go to: https://vercel.com/dashboard/integrations
2. Browse or search for "Postgres"
3. Add to your project

## Step 3: Configure Postgres

After adding from Marketplace:

1. **Create Database**:
   - You'll be prompted to create a new Postgres database
   - Name it: `coworking-db`
   - Select region: (closest to you)
   - Click "Create"

2. **Connection String Added Automatically**:
   - Vercel automatically adds `POSTGRES_URL` to your environment variables
   - You might need to also add it as `DATABASE_URL`

3. **Verify Environment Variables**:
   - Go to: Settings → Environment Variables
   - You should see several Postgres variables
   - If `DATABASE_URL` is missing, add it:
     - Name: `DATABASE_URL`
     - Value: Copy from `POSTGRES_URL`
   - Click "Save"

4. **Redeploy**:
   - Deployments tab → latest → ⋯ → Redeploy

## Step 4: Run Migrations

1. Go to your Postgres database in Vercel
2. Find "Data" or "Query" tab
3. Run this SQL (copy from local file):

```bash
cat /Users/David/co-working-dashboard/migrations/001_init.sql
```

4. Paste entire SQL into query editor
5. Execute

## Alternative: Use Neon (Easier!)

If Marketplace is confusing, use Neon instead (also free):

1. **Sign up at Neon**: https://neon.tech
2. **Create Project**: Click "New Project"
3. **Get Connection String**:
   - Dashboard → Connection Details
   - Copy the connection string
4. **Add to Vercel**:
   - Your project → Settings → Environment Variables
   - Add: `DATABASE_URL` = (paste Neon connection string)
   - Click "Save"
5. **Redeploy**: Deployments → ⋯ → Redeploy
6. **Run Migrations**: 
   - In Neon dashboard → SQL Editor
   - Paste contents of `migrations/001_init.sql`
   - Run

## I Recommend: Use Neon

It's actually simpler than Vercel's Marketplace:
- ✅ Clearer interface
- ✅ Better free tier
- ✅ Direct SQL editor
- ✅ No marketplace navigation needed
- ✅ Works perfectly with your dashboard

### Quick Neon Setup (2 minutes):

1. Go to https://neon.tech → Sign up
2. "New Project" → Name it "coworking"
3. Copy connection string (shown immediately)
4. In Vercel: Settings → Environment Variables → Add `DATABASE_URL`
5. Redeploy
6. In Neon: SQL Editor → Paste migration SQL → Run

Done! Much simpler than Marketplace.

## Which Should You Use?

| Option | Pros | Cons |
|--------|------|------|
| **Neon** | Simpler, better UI, easier migrations | External service |
| **Vercel Postgres** | Integrated with Vercel | Marketplace navigation, more complex setup |

**Recommendation: Use Neon** - it's faster to set up and easier to use.

Let me know which you prefer!
