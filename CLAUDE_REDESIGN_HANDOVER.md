# Co-Working Dashboard - Redesign Handover

Last updated: 2026-02-21

## 1) Scope
This handover documents the **new radical variant rebuild** from:
- `/Users/David/davidai/projects/co-working-dashboard/VARIANT_REDESIGN_PLAN.md`

This supersedes old "color-swap" variant assumptions.

## 2) Live URLs (Current)
All redesigned variants run on `/` (root), not `/overview`.

- V1 The Brief: [http://127.0.0.1:3101/](http://127.0.0.1:3101/)
- V2 The Cockpit: [http://127.0.0.1:3102/](http://127.0.0.1:3102/)
- V3 The Studio: [http://127.0.0.1:3103/](http://127.0.0.1:3103/)
- V4 The Map: [http://127.0.0.1:3104/](http://127.0.0.1:3104/)
- V5 The Pulse: [http://127.0.0.1:3105/](http://127.0.0.1:3105/)

Port status at handover time: `3101-3105` listening.

## 3) How to Run
From:
- `/Users/David/davidai/projects/co-working-dashboard`

Commands:
```bash
npm run dev:v1
npm run dev:v2
npm run dev:v3
npm run dev:v4
npm run dev:v5
```

Build check:
```bash
npm run build
```

## 4) Variant Product Definitions
- V1 (`3101`) - **The Brief**: single scroll, editorial top anchors, command palette, inline quick actions.
- V2 (`3102`) - **The Cockpit**: 4-panel mission-control viewport, keyboard-first flows, status bar, panel tabs.
- V3 (`3103`) - **The Studio**: mode-based app (Plan / Execute / Review), focus timer, weekly report card.
- V4 (`3104`) - **The Map**: spatial node canvas with pan/zoom, dependency edges, minimap, map quick-create.
- V5 (`3105`) - **The Pulse**: full-screen card feed, swipe/keyboard progression, momentum score, digest export.

## 5) Architecture (Current)
### Root rendering
- `/Users/David/davidai/projects/co-working-dashboard/app/page.tsx`
  - Renders `WorkspaceProvider + VariantDashboardRoot`

### Variant router
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/VariantDashboardRoot.tsx`
  - Maps `NEXT_PUBLIC_DASHBOARD_VARIANT` to v1-v5 components

### Variant implementations
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v1/BriefDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v2/CockpitDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v3/StudioDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v4/MapDashboard.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/v5/PulseDashboard.tsx`

### Shared redesign components
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/CommandPalette.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/MorningBrief.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/SparklineChart.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/MomentumScore.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/components/variants/shared/variantData.ts`

### Data layer (unchanged)
- `/Users/David/davidai/projects/co-working-dashboard/components/providers/WorkspaceProvider.tsx`
- `/Users/David/davidai/projects/co-working-dashboard/lib/workspace.ts`

## 6) Route Behavior
- `/` is the primary redesigned experience per variant.
- Legacy routes (`/overview`, `/kanban`, `/projects`, `/ideas`, `/reading`, `/activity`) still exist as fallback/legacy pages.
- Dashboard layout at `/Users/David/davidai/projects/co-working-dashboard/app/(dashboard)/layout.tsx` keeps old sidebar/header shell for non-root routes.

## 7) Config Notes
- Variant dist output path uses nested `.next` folders (fix for prior Tailwind cache issue):
  - `/Users/David/davidai/projects/co-working-dashboard/next.config.ts`
  - `distDir: .next/<variant>`

## 8) Validation Performed
- `npm run build` passes.
- Manual runtime checks on each root URL (`3101`-`3105`) confirm redesigned variant shells render.

## 9) Useful Troubleshooting
If user reports "not loading":
1. Check listeners:
```bash
lsof -nP -iTCP:3101,3102,3103,3104,3105 -sTCP:LISTEN
```
2. Restart all variant servers.
3. Hard refresh browser (`Cmd+Shift+R`).

## 10) Related Docs
- Prior general handover (legacy + middle + variants):
  - `/Users/David/davidai/projects/co-working-dashboard/CLAUDE_CODE_HANDOVER.md`
- Earlier variant review guide:
  - `/Users/David/davidai/projects/co-working-dashboard/CLAUDE_VARIANT_REVIEW_GUIDE.md`
