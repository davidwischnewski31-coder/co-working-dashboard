# Deploy Your Dashboard Now (5 Minutes)

✅ **Repository Created**: https://github.com/davidwischnewski31-coder/co-working-dashboard

## Step 1: Deploy on Vercel (2 minutes)

1. **Go to Vercel**: https://vercel.com/new

2. **Import Repository**:
   - Click "Import Git Repository"
   - Search for `co-working-dashboard`
   - Click "Import"

3. **Configure Project**:
   - Project Name: `co-working-dashboard` (or customize)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - **Don't add environment variables yet**
   - Click "Deploy"

4. **Wait for deployment** (about 1 minute)
   - You'll see a success page with your URL
   - Example: `https://co-working-dashboard-xxx.vercel.app`

## Step 2: Add Database (2 minutes)

1. **In your Vercel project**, click "Storage" tab

2. **Create Postgres Database**:
   - Click "Create Database"
   - Select "Postgres"
   - Click "Create"

3. **Get Connection String**:
   - Click on your new database
   - Go to "Settings" tab
   - Under "Connection String", copy the `DATABASE_URL` (starts with `postgres://...`)

4. **Add Environment Variable**:
   - Go back to your project
   - Settings → Environment Variables
   - Name: `DATABASE_URL`
   - Value: (paste the connection string)
   - Click "Save"

5. **Redeploy**:
   - Go to "Deployments" tab
   - Click ⋯ menu on latest deployment
   - Click "Redeploy"
   - Wait ~1 minute

## Step 3: Run Database Migrations (1 minute)

1. **Go to Vercel Dashboard** → Your project → Storage → Your Database

2. **Click "Query" tab**

3. **Copy this entire SQL** (from your local repo):
   ```bash
   # In terminal:
   cat /Users/David/co-working-dashboard/migrations/001_init.sql
   ```

4. **Paste into Query editor** and click "Run Query"

5. **Verify**: You should see "Query executed successfully"

## Step 4: Test Your Dashboard! 🎉

1. **Visit your Vercel URL** (from Step 1)

2. **Test the sync**:
   - Go to "Projects" page
   - Click "Sync Projects" button
   - Should import 17 projects from davidai

3. **Explore**:
   - ✅ Kanban: Create a task, drag it between columns
   - ✅ Projects: See your synced projects
   - ✅ Ideas: Add an idea
   - ✅ Reading: Create a reading list
   - ✅ Activity: See the audit trail

## Your URLs

- **GitHub**: https://github.com/davidwischnewski31-coder/co-working-dashboard
- **Vercel**: (you'll get this after Step 1)

## Troubleshooting

### Database Connection Error
- Make sure DATABASE_URL is set in Environment Variables
- Must include `?sslmode=require` at the end
- Redeploy after adding env vars

### Projects Not Syncing
- Check that `/Users/David/davidai/knowledge/projects/` exists
- This will only work if deploying to a server with access to davidai
- For now, you can manually create projects via the UI

### Migration Fails
- Make sure you copied the ENTIRE SQL file
- Check for any error messages in the query result
- Try running it again (it's idempotent)

## Need Help?

The dashboard is already deployed at your Vercel URL. Just need to:
1. Add the database
2. Run migrations
3. Start using it!

Total time: ~5 minutes
