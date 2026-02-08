# Finding Postgres in Vercel - Step by Step

## Method 1: After You Deploy (Easiest)

1. **Deploy your project first** (if you haven't):
   - Go to https://vercel.com/new
   - Import `co-working-dashboard`
   - Click "Deploy" (ignore errors about DATABASE_URL for now)

2. **Once deployed, in your project dashboard**:
   - Look for tabs at the top: Overview, Deployments, Analytics, **Storage**, Settings
   - Click the **"Storage"** tab
   - Click "Create Database" button
   - You'll see options: **Postgres**, KV, Blob, Edge Config
   - Select **"Postgres"**
   - Click "Continue"
   - Name it (e.g., "coworking-db")
   - Select region (choose closest to you)
   - Click "Create"

## Method 2: Direct Link to Storage

After deploying, go directly to:
```
https://vercel.com/[your-username]/co-working-dashboard/stores
```

Replace `[your-username]` with your Vercel username.

## Method 3: From Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your `co-working-dashboard` project
3. Look for "Storage" in the top navigation
4. Click "Create Database"
5. Select "Postgres"

## What if "Storage" tab is missing?

### Option A: Check Your Plan
- Postgres requires a Vercel account (free tier works!)
- Make sure you're logged in
- The Storage tab appears AFTER you deploy a project

### Option B: Use the Direct URL
Go to: https://vercel.com/dashboard/stores

Then:
- Click "Create"
- Select "Postgres Database"
- Connect it to your project

## What Postgres Looks Like in Vercel:

When you find it, you'll see:
- **Icon**: Purple elephant (Postgres logo)
- **Name**: "Postgres"
- **Description**: "Serverless SQL Database"
- **Free tier**: Included (60 hours compute time)

## After Creating Postgres:

1. **Get connection string**:
   - Click on your new database
   - Go to `.env.local` tab OR "Quickstart" tab
   - You'll see: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.
   - Copy the one called `POSTGRES_URL` or `DATABASE_URL`

2. **Add to your project**:
   - Go back to project → Settings → Environment Variables
   - Add: `DATABASE_URL` = (paste the connection string)
   - Click "Save"

3. **Redeploy**:
   - Deployments tab → latest deployment → ⋯ → Redeploy

## Still Can't Find It?

### Alternative: Use Neon (Free Postgres)

If you can't access Vercel Postgres, use Neon instead:

1. Go to https://neon.tech
2. Sign up (free)
3. Create new project
4. Copy connection string
5. In Vercel: Settings → Environment Variables
6. Add `DATABASE_URL` with Neon connection string
7. Redeploy

## Need Visual Help?

The Storage tab should look like this:
```
┌─────────────────────────────────────┐
│ Overview Deployments Storage Settings│  <- Click "Storage"
├─────────────────────────────────────┤
│                                     │
│     Create Database                 │  <- Click this
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Postgres │  │    KV    │       │  <- Choose Postgres
│  │    🐘    │  │          │       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
```

Let me know which method works for you or where you're stuck!
