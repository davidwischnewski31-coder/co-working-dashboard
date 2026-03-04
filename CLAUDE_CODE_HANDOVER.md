# Co-Working Dashboard - Claude Code Handover

Last updated: 2026-02-21

## 1) Current Targets

There are 7 dashboard targets in scope:

1. Old version (legacy snapshot)
2. In-between build (pre-variant rebuild) on port 3106
3. Five fully rebuilt product variants on ports 3101-3105

## 2) Live URLs

### Legacy + In-between
- Old version (legacy clone): [http://127.0.0.1:3000](http://127.0.0.1:3000)
- In-between build: [http://127.0.0.1:3106](http://127.0.0.1:3106)

### Variant builds (rebuilt full dashboards)
- V1 - The Brief: [http://127.0.0.1:3101](http://127.0.0.1:3101)
- V2 - The Cockpit: [http://127.0.0.1:3102](http://127.0.0.1:3102)
- V3 - The Studio: [http://127.0.0.1:3103](http://127.0.0.1:3103)
- V4 - The Map: [http://127.0.0.1:3104](http://127.0.0.1:3104)
- V5 - The Pulse: [http://127.0.0.1:3105](http://127.0.0.1:3105)

Common tab routes on each variant host:
- `/overview`
- `/kanban`
- `/projects`
- `/ideas`
- `/reading`
- `/activity`

## 3) Runtime Status (at handover)

Port listeners detected:
- 3101: online
- 3102: online
- 3103: online
- 3104: online
- 3105: online
- 3106: offline

## 4) Run Commands

### Legacy snapshot
```bash
cd /tmp/co-working-dashboard-legacy
npx next dev --webpack --hostname 127.0.0.1 --port 3000
```

### In-between build
```bash
cd /tmp/co-working-dashboard-middle
npx next dev --webpack --hostname 127.0.0.1 --port 3106
```

### Rebuilt variants project
```bash
cd /Users/David/davidai/projects/co-working-dashboard
npm run dev:v1   # 3101
npm run dev:v2   # 3102
npm run dev:v3   # 3103
npm run dev:v4   # 3104
npm run dev:v5   # 3105
```

Build check:
```bash
cd /Users/David/davidai/projects/co-working-dashboard
npm run build
```

## 5) What Was Implemented From VARIANT_REDESIGN_PLAN2.md

### V1 - The Brief
File: `/Users/David/davidai/projects/co-working-dashboard/components/variants/v1/BriefDashboard.tsx`
- Ideas Pipeline changed from vertical grid to horizontal swimlane lanes with overflow scroll.
- Section headings switched to Fraunces (`--font-fraunces`).
- Activity Stream now supports `Show all / Show less` (no dead-end truncation).

### V2 - The Cockpit
File: `/Users/David/davidai/projects/co-working-dashboard/components/variants/v2/CockpitDashboard.tsx`
- Header clock now updates continuously via interval state.
- Notifications panel now uses real computed workspace signals:
  - blocker count
  - unread article count
  - velocity trend direction
- Focus panel keyboard behavior added:
  - `j/k` cursor move (focused focus-list context)
  - `Enter` expand selected item
  - `Escape` collapse expanded item
- JetBrains Mono applied to data-dense surfaces (status line, timestamps, key numeric readouts).

### V3 - The Studio
File: `/Users/David/davidai/projects/co-working-dashboard/components/variants/v3/StudioDashboard.tsx`
- Mode transitions now animate with directional slide (forward/back, ~300ms).
- Keyboard mode switching added:
  - `P` = Plan
  - `E` = Execute
  - `R` = Review
- Typography updates:
  - Instrument Serif for watermark and major section headings
  - Mono (`--font-plex-mono`) for timer and metric numbers

### V4 - The Map
File: `/Users/David/davidai/projects/co-working-dashboard/components/variants/v4/MapDashboard.tsx`
- Three zoom levels implemented:
  - Portfolio (`< 0.6`): project-level view
  - Cluster (`0.6-1.2`): project + cluster detail
  - Task focus (`> 1.2`): focused task cluster + inline task detail card
- Zoom now eases toward target (animated interpolation), rather than instant jump.
- Idea-to-project mapping replaced modulo assignment with relationship heuristic (title/category to project name).
- Sidebar detail panel removed; task detail is now map-native inline overlay in focused zoom.

### V5 - The Pulse
File: `/Users/David/davidai/projects/co-working-dashboard/components/variants/v5/PulseDashboard.tsx`
- Left-swipe/`ArrowLeft` snooze now re-queues card to end of stack (instead of dismissing).
- Card flow now uses animated directional transitions on navigation.
- Newsreader typography applied to major card headlines.
- `Share your Pulse` moved from activity card to done/caught-up card.

### Shared typography + animation support
Files:
- `/Users/David/davidai/projects/co-working-dashboard/app/layout.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/app/globals.css`

Changes:
- Loaded and exposed additional fonts: Fraunces, Instrument Serif, JetBrains Mono, Newsreader.
- Added global keyframes for Studio and Pulse transition behaviors.

## 6) Component Map (Rebuilt Variant Layer)

### Variant entrypoints
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v1/BriefDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v2/CockpitDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v3/StudioDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v4/MapDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v5/PulseDashboard.tsx`

### Shared variant modules
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/CommandPalette.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/MorningBrief.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/MomentumScore.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/SparklineChart.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/variantData.ts`

### Data/state layer
- `/Users/David/davidai/projects/co-working-dashboard/components/providers/WorkspaceProvider.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/lib/workspace.ts`

### Variant routing
- `/Users/David/davidai/projects/co-working-dashboard/app/page.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/lib/dashboardVariant.ts`

## 7) Notes for Claude Code

- This project is intentionally local-first and can run on dummy data.
- Backend hardening is not required for current UX/UI exploration.
- Primary objective now is comparative product direction across full-dashboard variants.
- If continuing redesign iterations, preserve per-variant separation and keep each host independently runnable on its dedicated port.
