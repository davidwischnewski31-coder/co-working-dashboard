# Claude Variant Review Guide

## Purpose
This project contains **5 separate full-dashboard variants** intended for side-by-side UX/UI comparison.

- v1: Command Grid
- v2: Flow Atelier
- v3: Story OS
- v4: Orbit Field
- v5: Capital Desk

## Run Each Variant (separate localhost)
From project root:

```bash
npm run dev:v1   # http://127.0.0.1:3101
npm run dev:v2   # http://127.0.0.1:3102
npm run dev:v3   # http://127.0.0.1:3103
npm run dev:v4   # http://127.0.0.1:3104
npm run dev:v5   # http://127.0.0.1:3105
```

## Build Check
```bash
npm run build
```

## Variant Infrastructure
- Variant resolver and journey copy: `/Users/David/davidai/projects/co-working-dashboard/lib/dashboardVariant.ts`
- Shared journey panel used across tabs: `/Users/David/davidai/projects/co-working-dashboard/components/variant/JourneyPanel.tsx`
- Variant-aware shell:
  - `/Users/David/davidai/projects/co-working-dashboard/app/layout.tsx`
  - `/Users/David/davidai/projects/co-working-dashboard/app/(dashboard)/layout.tsx`
  - `/Users/David/davidai/projects/co-working-dashboard/components/layout/Header.tsx`
  - `/Users/David/davidai/projects/co-working-dashboard/components/layout/Sidebar.tsx`
- Variant styling and layout overrides:
  - `/Users/David/davidai/projects/co-working-dashboard/app/globals.css`

## Core Tabs to Review in Every Variant
- `/overview`
- `/kanban`
- `/projects`
- `/ideas`
- `/reading`
- `/activity`

## What Should Differ Across Variants
1. Visual identity (palette, typography feel, component shapes)
2. Information hierarchy and section ordering
3. Action emphasis (which CTAs are strongest/first)
4. Interaction style and workflow framing
5. Overall user journey clarity per dashboard philosophy

## Review Checklist for Claude
1. Confirm each variant loads and all six tabs are functional.
2. Evaluate whether differences are substantial (not just color swaps).
3. Note strongest features from each variant worth merging.
4. Flag weak or redundant patterns to remove.
5. Recommend a combined "best-of" final direction.

## Notes
- There are also `/experiments/*` routes from earlier prototype work.
- Current comparison focus is the **full dashboards on ports 3101–3105**.
