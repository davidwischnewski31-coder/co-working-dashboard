# 3106 v2 — Codex Build Document

**Target**: Create an improved version of the multi-page co-working dashboard. The existing project at `/Users/David/davidai/projects/co-working-dashboard` runs on port 3106 — do not modify it. Copy it, apply the changes below, run the copy on port 3108.

---

## Step 0: Setup

```bash
cp -r /Users/David/davidai/projects/co-working-dashboard /Users/David/davidai/projects/co-working-dashboard-v2
cd /Users/David/davidai/projects/co-working-dashboard-v2
npm install
```

Run on port 3108:
```bash
npm run dev -- -p 3108
```

All changes below apply to `/Users/David/davidai/projects/co-working-dashboard-v2/`.

---

## Step 1: Color System

**File: `app/globals.css` — replace the entire `:root` block (lines 3–38)**

```css
:root {
  --background: #f3ead9;
  --foreground: #1a1208;
  --surface: #fdf7ee;
  --surface-strong: #ffffff;
  --muted: #6b5c48;
  --border: #dfd3be;
  --accent: #c8620a;
  --accent-strong: #a04d06;
  --accent-soft: #fde8d0;
  --ring: #0f766e;

  --font-dashboard-sans: var(--font-space-grotesk);
  --font-dashboard-display: var(--font-bricolage);
  --font-dashboard-mono: var(--font-plex-mono);

  --font-display: var(--font-newsreader), Georgia, serif;
  --font-editorial: var(--font-fraunces), Georgia, serif;
  --font-data: var(--font-jetbrains-mono), monospace;
  --font-body: var(--font-inter), system-ui, sans-serif;

  --variant-shell-bg: linear-gradient(160deg, #f3ead9 0%, #ece1cc 100%);
  --variant-main-bg: transparent;
  --variant-header-bg: rgba(248, 241, 228, 0.92);
  --variant-sidebar-bg: rgba(246, 238, 222, 0.94);
  --variant-brand-bg: linear-gradient(135deg, #1c1009 0%, #2e1c0e 100%);
  --variant-brand-text: #f5e8d4;
  --variant-border-strong: #d4c4a8;
  --variant-card-bg: rgba(255, 250, 242, 0.96);
  --variant-chip-bg: #fde8d0;
  --variant-chip-text: #7a3908;
  --variant-nav-idle: #4a3620;
  --variant-nav-active-bg: rgba(200, 98, 10, 0.12);
  --variant-nav-active-text: #7a3908;
  --variant-accent: #c8620a;
  --variant-accent-strong: #a04d06;
}
```

**Why**: `#ef6c00` is construction-cone orange — it reads urgency/warning. `#c8620a` is burnt amber — warm, authoritative. The sidebar brand shifts from a flat orange badge to an espresso wordmark. Dark on warm creates real brand separation.

---

## Step 2: Typography

**File: `app/globals.css` — add after the last variant-page ordering rule (after line 468, before the `@keyframes studioSlideForward` block)**

```css
/* 3106-v2 — display font for content headings */
body:not([data-variant]) .variant-page h1,
body:not([data-variant]) .variant-page h2 {
  font-family: var(--font-dashboard-display), 'Avenir Next', sans-serif;
  letter-spacing: -0.02em;
}
```

`body:not([data-variant])` targets only the middle theme (3106-v2). V1–V6 all set `data-variant` and are unaffected.

---

## Step 3: Sidebar

**File: `components/layout/Sidebar.tsx`**

Line 63 — tighten brand block padding:
```tsx
// FROM:
<div className="variant-sidebar-brand mb-6 flex items-center justify-between rounded-2xl p-4">

// TO:
<div className="variant-sidebar-brand mb-6 flex items-center justify-between rounded-xl px-4 py-3">
```

Line 67 — add tracking to wordmark:
```tsx
// FROM:
<h1 className="text-lg font-semibold">Co-Working</h1>

// TO:
<h1 className="text-lg font-semibold tracking-tight">Co-Working</h1>
```

---

## Step 4: Header — Add CMD+K badge

**File: `components/layout/Header.tsx` — add before the Reset button (before line 60)**

```tsx
<kbd className="hidden items-center gap-1 rounded-lg border border-[#d4c4a8] bg-[rgba(255,250,242,0.9)] px-2.5 py-1.5 text-xs font-medium text-[#6b5c48] lg:inline-flex">
  <span className="text-[10px]">⌘</span>K
</kbd>
```

---

## Step 5: Overview Page

**File: `app/(dashboard)/overview/page.tsx`**

### 5a. Add urgentTasks count near top of OverviewPage function

After line 52 (`const unreadArticles = ...`), add:
```tsx
const urgentTasks = activeTasks.filter((task) => task.priority === 'urgent')
```

### 5b. Replace the hero section (lines 61–92)

The current hero has a static marketing paragraph. Replace with a paragraph + live status pills + momentum score in the top-right.

```tsx
<section className="rounded-3xl border border-[#dfc9a0] bg-gradient-to-br from-[#fef3e3] to-[#fdecd4] p-6 shadow-sm sm:p-8">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div className="max-w-2xl space-y-4">
      <p className="inline-flex items-center gap-2 rounded-full border border-[#e8c99a] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7a3908]">
        <Sparkles className="h-3.5 w-3.5" />
        Daily Command Center
      </p>
      <h1 className="text-2xl font-semibold leading-tight text-[#1a1208] sm:text-3xl">
        Run the day from one place and keep momentum visible.
      </h1>

      {/* Live status pills — scannable in 0.3s */}
      <div className="flex flex-wrap gap-2">
        {urgentTasks.length > 0 && (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
            {urgentTasks.length} Urgent
          </span>
        )}
        {blockedTasks.length > 0 && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
            {blockedTasks.length} Blocked
          </span>
        )}
        {unreadArticles.length > 0 && (
          <span className="rounded-full border border-[#e8c99a] bg-[#fde8d0] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7a3908]">
            {unreadArticles.length} Unread
          </span>
        )}
        {urgentTasks.length === 0 && blockedTasks.length === 0 && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Clear to execute
          </span>
        )}
      </div>
    </div>

    {/* Momentum score — top right of hero, dominant */}
    <MomentumHero data={data} />
  </div>

  <div className="mt-6 flex flex-wrap gap-3">
    <Link
      href="/kanban"
      className="inline-flex items-center gap-2 rounded-xl bg-[#c8620a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a04d06]"
    >
      Open Task Board
      <ArrowRight className="h-4 w-4" />
    </Link>
    <Link
      href="/ideas"
      className="inline-flex items-center gap-2 rounded-xl border border-[#d4c4a8] bg-white px-4 py-2.5 text-sm font-semibold text-[#4a3620] transition-colors hover:bg-[#fdf7ee]"
    >
      Review Ideas
    </Link>
  </div>
</section>
```

### 5c. Update metric cards grid — remove the 4th card, keep 3, let momentum be the hero

Change line 94:
```tsx
// FROM:
<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

// TO:
<section className="grid gap-4 sm:grid-cols-3">
```

Remove the `<MetricCard label="Unread Articles" ... />` entry — unread is now surfaced in the hero pills. Keep: Active Tasks, Completed, Blocked.

### 5d. Update MetricCard component (lines 217–225)

Add left-border accent and mono font for numbers:
```tsx
function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: number
  note: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#dfc9a0] border-l-4 border-l-[#c8620a] bg-[#fffaf2] p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#fde8d0] p-2 text-[#7a3908]">{icon}</div>
      <p className="text-sm font-medium text-[#6b5c48]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1a1208] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[#6b5c48]">{note}</p>
    </div>
  )
}
```

### 5e. Update Focus Queue task items (line 142)

Add hover micro-lift:
```tsx
// FROM:
<li
  key={task.id}
  className="rounded-xl border border-[#efe4d4] bg-[#fffcf8] p-4 transition-colors hover:border-[#e4d2b8]"
>

// TO:
<li
  key={task.id}
  className="rounded-xl border border-[#e4d2b8] bg-[#fffdf8] p-4 transition-all hover:border-[#c8a880] hover:shadow-sm hover:-translate-y-px"
>
```

### 5f. Update all remaining color references in the file

| Old value | New value |
|---|---|
| `text-orange-700` (all) | `text-[#7a3908]` |
| `text-orange-600` | `text-[#c8620a]` |
| `bg-[#fff3e7]` | `bg-[#fde8d0]` |
| `bg-[#fff6ea]` | `bg-[#fde8d0]` |
| `bg-[#f2fbf7]` | keep |
| `bg-[#f4f8ff]` | keep |
| `text-slate-900` | `text-[#1a1208]` |
| `text-slate-600` | `text-[#6b5c48]` |
| `text-slate-500` | `text-[#6b5c48]` |
| `border-[#e6dac6]` | `border-[#d4c4a8]` |

### 5g. Add MomentumHero component (at bottom of file)

```tsx
import { calculateMomentumScore } from '@/components/variants/shared/variantData'
import type { WorkspaceData } from '@/lib/workspace'

function MomentumHero({ data }: { data: WorkspaceData }) {
  const { score, delta } = calculateMomentumScore(data)

  return (
    <div className="shrink-0 rounded-2xl border border-[#dfc9a0] bg-white/60 p-5 text-right">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b5c48]">Momentum</p>
      <p className="mt-1 font-[family-name:var(--font-dashboard-mono)] text-5xl font-semibold tabular-nums text-[#1a1208]">
        {score}
      </p>
      <p className="text-sm text-[#6b5c48]">/ 100</p>
      <p className="mt-1 text-xs text-[#6b5c48]">
        {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} vs last week
      </p>
    </div>
  )
}
```

---

## Step 6: Kanban Page — Primary Task Hero

**File: `app/(dashboard)/kanban/page.tsx`**

The current layout is: form → filters → board. The new layout adds a hero card above the form showing the highest-priority non-done task with action buttons. This is the "command center vs. spreadsheet" distinction.

### 6a. Add primaryTask derived value after line 75 (`const doneTaskCount = ...`)

```tsx
const primaryTask = useMemo(
  () => filteredTasks.find((task) => task.status !== 'done') ?? null,
  [filteredTasks]
)

function handleMarkDone(taskId: string) {
  moveTask(taskId, 'done')
}

function handleMarkBlocked(taskId: string) {
  moveTask(taskId, 'blocked')
}
```

### 6b. Add primary task hero section before the `<section>` containing the form (before line 108)

```tsx
{primaryTask && (
  <section className="rounded-2xl border border-[#dfc9a0] bg-gradient-to-br from-[#fef3e3] to-[#fdecd4] p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a3908]">Now — Primary Task</p>
        <h2 className="text-xl font-semibold text-[#1a1208] sm:text-2xl">{primaryTask.title}</h2>
        {primaryTask.description && (
          <p className="text-sm text-[#6b5c48]">{primaryTask.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[primaryTask.priority]}`}>
            {primaryTask.priority}
          </span>
          {primaryTask.project_name && (
            <span className="rounded-full border border-[#d4c4a8] bg-white/70 px-2.5 py-1 text-xs text-[#4a3620]">
              {primaryTask.project_name}
            </span>
          )}
          {primaryTask.due_date && (
            <span className="text-xs text-[#6b5c48]">
              Due {new Date(primaryTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          onClick={() => handleMarkDone(primaryTask.id)}
          className="rounded-xl bg-[#c8620a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a04d06]"
        >
          Mark Done
        </button>
        <button
          onClick={() => handleMarkBlocked(primaryTask.id)}
          className="rounded-xl border border-[#d4c4a8] bg-white/70 px-4 py-2 text-sm font-semibold text-[#4a3620] transition-colors hover:bg-white"
        >
          I'm Blocked
        </button>
      </div>
    </div>
  </section>
)}
```

Note: `priorityClasses` is already defined at the top of this file (imported from the workspace types). Verify the import at line 29 before using it. If it's not imported in this file, add:

```tsx
const priorityClasses: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-slate-100 text-slate-700',
}
```

### 6c. Update kanban form section colors

In the form section (line 108+):
- `border-[#e6dac6]` → `border-[#d4c4a8]`
- `bg-[#fff5e8]` → `bg-[#fde8d0]` (Local-first chip)
- `text-orange-700` → `text-[#7a3908]`
- `bg-[#ef6c00]` → `bg-[#c8620a]` (Add Task button)
- `hover:bg-[#d75b00]` → `hover:bg-[#a04d06]`
- `focus:border-orange-300` → `focus:border-[#c8a880]`
- `focus:ring-orange-100` → `focus:ring-[#fde8d0]`
- `bg-[#fffdf9]` → `bg-[#fdf7ee]`
- `border-[#e8dcc8]` → `border-[#d4c4a8]`

---

## Step 7: Create StatusBar Component

**Create: `components/layout/StatusBar.tsx`**

```tsx
'use client'

import { useWorkspace } from '@/components/providers/WorkspaceProvider'

export function StatusBar() {
  const { data } = useWorkspace()

  const active = data.tasks.filter((t) => t.status !== 'done').length
  const blocked = data.tasks.filter((t) => t.status === 'blocked').length
  const urgent = data.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length
  const unread = data.articles.filter((a) => a.status === 'unread').length
  const ideas = data.ideas.filter((i) => i.status !== 'shipped').length

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 hidden border-t border-[#d4c4a8] bg-[rgba(246,238,222,0.96)] backdrop-blur lg:left-72 lg:flex">
      <div className="flex h-9 items-center gap-5 px-6 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums lg:px-8">
        <span>
          <span className="font-semibold text-[#1a1208]">{active}</span> active
        </span>
        <span className="text-[#d4c4a8]">·</span>
        <span>
          <span className={`font-semibold ${blocked > 0 ? 'text-red-700' : 'text-[#1a1208]'}`}>{blocked}</span>{' '}
          <span className={blocked > 0 ? 'text-red-700' : ''}>blocked</span>
        </span>
        <span className="text-[#d4c4a8]">·</span>
        <span>
          <span className="font-semibold text-[#1a1208]">{urgent}</span> urgent
        </span>
        <span className="text-[#d4c4a8]">·</span>
        <span>
          <span className="font-semibold text-[#1a1208]">{ideas}</span> ideas
        </span>
        <span className="text-[#d4c4a8]">·</span>
        <span>
          <span className="font-semibold text-[#1a1208]">{unread}</span> unread
        </span>
      </div>
    </div>
  )
}
```

Note: `lg:left-72` aligns the bar with the main content area (sidebar is `w-72`). On screens below `lg`, the sidebar is hidden and the bar spans full width (`left-0`).

---

## Step 8: Wire CMD+K and StatusBar in Layout

**File: `app/(dashboard)/layout.tsx`**

Replace the entire file:

```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { StatusBar } from '@/components/layout/StatusBar'
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider'
import { CommandPalette, type CommandAction } from '@/components/variants/shared/CommandPalette'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const commandActions: CommandAction[] = useMemo(() => [
    { id: 'nav-overview', label: 'Go to Overview', keywords: ['home', 'summary'], run: () => router.push('/overview') },
    { id: 'nav-kanban', label: 'Go to Kanban', keywords: ['tasks', 'board', 'work'], run: () => router.push('/kanban') },
    { id: 'nav-projects', label: 'Go to Projects', keywords: ['initiatives'], run: () => router.push('/projects') },
    { id: 'nav-ideas', label: 'Go to Ideas', keywords: ['pipeline', 'brainstorm'], run: () => router.push('/ideas') },
    { id: 'nav-reading', label: 'Go to Reading', keywords: ['articles', 'queue'], run: () => router.push('/reading') },
    { id: 'nav-activity', label: 'Go to Activity', keywords: ['log', 'timeline'], run: () => router.push('/activity') },
  ], [router])

  if (pathname === '/') {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="variant-shell min-h-screen lg:flex">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        actions={commandActions}
        title="Co-Working"
        placeholder="Navigate, search, or run actions..."
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="variant-main flex min-h-screen min-w-0 flex-1 flex-col">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-12 sm:p-6 sm:pb-12 lg:p-8 lg:pb-12">{children}</main>
        <StatusBar />
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  )
}
```

Note: `pb-12` on `<main>` ensures content does not hide behind the status bar (status bar is `h-9` = 36px, 48px padding clears it with margin).

---

## Step 9: Remaining Page Color Updates

Apply these find-replace operations across all page files in `app/(dashboard)/`:

| Old | New | Files |
|---|---|---|
| `border-[#e6dac6]` | `border-[#d4c4a8]` | all |
| `bg-[#fffdf9]`, `bg-[#fffcf8]`, `bg-[#fffdf8]` | `bg-[#fdf7ee]` | all |
| `border-[#e8dcc8]` | `border-[#d4c4a8]` | all |
| `text-orange-700`, `text-orange-600` | `text-[#7a3908]` | all |
| `bg-[#fff5e8]`, `bg-[#fff3e7]`, `bg-[#fff6ea]` | `bg-[#fde8d0]` | all |
| `text-slate-900` | `text-[#1a1208]` | all |
| `text-slate-600`, `text-slate-500` | `text-[#6b5c48]` | all |
| `text-slate-800` | `text-[#2d1e12]` | all |
| `border-dashed border-[#eadfcf]` | `border-dashed border-[#d4c4a8]` | all |

---

## Execution Order

1. `cp -r co-working-dashboard co-working-dashboard-v2` + `npm install`
2. `app/globals.css` — replace `:root` block
3. `app/globals.css` — add heading typography rule
4. `components/layout/Sidebar.tsx` — brand block padding + tracking
5. `components/layout/Header.tsx` — add CMD+K kbd chip
6. `components/layout/StatusBar.tsx` — create new file
7. `app/(dashboard)/layout.tsx` — full replacement (CMD+K state + CommandPalette + StatusBar)
8. `app/(dashboard)/overview/page.tsx` — hero redesign, status pills, MomentumHero, MetricCard update, color sweep
9. `app/(dashboard)/kanban/page.tsx` — primary task hero, color sweep
10. Color sweep on `projects/page.tsx`, `ideas/page.tsx`, `reading/page.tsx`, `activity/page.tsx`

---

## What This Does Not Change

- V1–V6 variants: untouched. Every CSS rule scoped to `body:not([data-variant])` or via `:root` default values. Variants override `:root` with their own `body[data-variant='vX']` blocks which take precedence.
- Data model: untouched. All changes are presentation layer.
- Multi-page navigation structure: untouched. The new version keeps the sidebar + page-per-section architecture that makes 3106 the right direction.

---

## What Was Evaluated and Cut

**V1's horizontal scroll focus queue**: correct for V1's single-page morning brief. In 3106's overview, the focus queue sits in a two-column grid beside Current Friction. Horizontal scroll inside a grid column creates a nested scroll context — confusing on touch, awkward on desktop. Rejected.

**V3's mode dock (PLAN / EXECUTE / REVIEW)**: V3 is single-page with modes as its entire mechanic. 3106 is multi-page — each page is already a mode. Adding a dock duplicates the sidebar navigation. Rejected.

**V5 card transitions (Framer Motion)**: V5's entire UX is the card-flip metaphor. The overhead of Framer Motion for page-level transitions in a multi-page app exceeds the benefit. `variantFade` in globals.css handles page entry already. Rejected.

**V4 node graph**: Different paradigm entirely. Not portable to a multi-page shell.
