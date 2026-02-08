# Co-Working Dashboard V2 - Deployment Guide

## What's New in V2

1. **Priority Lanes UI** (`/v2`)
   - 4-lane board: High, Medium, Low, Backlog
   - Drag-and-drop task prioritization
   - Project filtering sidebar

2. **Quick Task Creation**
   - Keyboard shortcut: `⌘K` (Cmd+K)
   - Minimal fields: title, project, priority, assignee
   - Target: <10 seconds to create task

3. **Progress Dashboard**
   - Stats overview (completed, active, human vs AI)
   - Velocity chart (last 4 weeks)
   - Per-project breakdown

4. **Navigation Update**
   - New "V2 Dashboard" link in sidebar
   - V1 still accessible at original routes

## Deployment Steps

### 1. Run Database Migration

The migration adds V2 schema changes to Vercel Postgres:
- `assignee` and `assignee_type` columns
- `position` column for manual ordering
- `completed_at` timestamp for progress tracking
- `task_stats` view for analytics
- `blocked` status support

**To run migration:**

```bash
# Get DATABASE_URL from Vercel project settings
# Settings → Environment Variables → DATABASE_URL

DATABASE_URL="postgres://..." node scripts/migrate-v2.js
```

### 2. Deploy to Vercel

```bash
git add .
git commit -m "feat: V2 priority dashboard with quick create and stats"
git push origin main
```

Vercel will auto-deploy.

### 3. Verify Deployment

After deployment:
1. Visit `/v2` route
2. Test drag-and-drop between priority lanes
3. Test quick create with `⌘K`
4. Click "Show Stats" to verify analytics

## What Works

- ✅ Priority lanes with drag-and-drop
- ✅ Project filtering
- ✅ Quick task creation (Cmd+K)
- ✅ Progress dashboard with stats
- ✅ Navigation updated
- ✅ All V1 routes still functional

## What Needs Polish (Future)

- **Drag-and-drop UX**: Add visual feedback during drag
- **Stats charts**: Consider adding recharts for better visualizations
- **Quick create**: Add keyboard navigation (Tab between fields)
- **Assignee avatars**: Show actual user photos instead of emoji
- **Real-time updates**: Add WebSocket support for live collaboration
- **Mobile responsive**: Optimize priority lanes for mobile screens

## Database Schema Changes

```sql
-- New columns added to tasks table
ALTER TABLE tasks ADD COLUMN assignee TEXT;
ALTER TABLE tasks ADD COLUMN assignee_type TEXT CHECK(assignee_type IN ('human', 'agent', 'unassigned'));
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;

-- New task_stats view for analytics
CREATE VIEW task_stats AS ...
```

## Token Efficiency Notes

V2 was implemented with minimal token usage:
- Reused existing components (TaskCard, AttributionBadge)
- Simple UI components (Dialog, Select) instead of heavy libraries
- Basic stats visualization (no recharts dependency)
- Focused on functionality over perfection

## Next Steps

1. Deploy and test in production
2. Gather feedback on priority workflow
3. Monitor task completion velocity
4. Iterate based on usage patterns
