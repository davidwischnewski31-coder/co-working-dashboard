# 3106 Improvement Plan

_Codex: execute in order, no follow-up questions needed._

---

## Diagnosis

3106's direction is correct — multi-page, focused, warm. Three problems:

1. **Color is generic.** `#ef6c00` is construction-cone orange. The sidebar brand gradient looks like a Bootstrap badge, not an identity.
2. **Typography has no character.** Space Grotesk is in use for body. Bricolage Grotesque is already loaded in `app/layout.tsx` (line 20-23) but applied to zero headings. The app looks like SaaS.
3. **Structural flatness.** Cards are white on beige. No depth signal. No sense of layers.

---

## 1. Color System

**File: `app/globals.css` — replace entire `:root` block (lines 3–38)**

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

**Why:** `#ef6c00` reads urgency/warning. `#c8620a` is burnt amber — warm, authoritative, not alarming. The sidebar brand shifts from orange badge to espresso wordmark — dark on warm creates proper brand separation.

---

### Hardcoded color replacements in page files

**`app/(dashboard)/overview/page.tsx`**

| Location | Old | New |
|---|---|---|
| Line 64 — hero label border | `border-orange-200` | `border-[#e8c99a]` |
| Line 65 — hero label text | `text-orange-700` | `text-[#7a3908]` |
| Line 61 — hero section gradient | `from-[#fff2df] via-[#fff7ed] to-[#eef8f4]` | `from-[#fef3e3] to-[#fdecd4]` |
| Line 61 — hero section border | `border-[#e8dac2]` | `border-[#dfc9a0]` |
| Line 79 — CTA button bg | `bg-[#ef6c00]` | `bg-[#c8620a]` |
| Line 79 — CTA button hover | `hover:bg-[#d55a00]` | `hover:bg-[#a04d06]` |
| Line 128 — Target icon | `text-orange-600` | `text-[#c8620a]` |
| Line 176 — blocked count | `text-orange-700` | `text-[#7a3908]` |
| Line 219 — metric icon bg | `bg-[#fff3e7]` | `bg-[#fde8d0]` |
| Line 219 — metric icon text | `text-orange-700` | `text-[#7a3908]` |
| Line 175 — friction blocked row bg | `bg-[#fff6ea]` | `bg-[#fde8d0]` |

**`app/(dashboard)/kanban/page.tsx`**

| Location | Old | New |
|---|---|---|
| Line 116 — Local-first chip bg | `bg-[#fff5e8]` | `bg-[#fde8d0]` |
| Line 116 — Local-first chip text | `text-orange-700` | `text-[#7a3908]` |
| Line 209 — Add Task button bg | `bg-[#ef6c00]` | `bg-[#c8620a]` |
| Line 209 — Add Task button hover | `hover:bg-[#d75b00]` | `hover:bg-[#a04d06]` |
| Line 221 — Filters chip bg | `bg-[#fff5e8]` | `bg-[#fde8d0]` |
| Line 221 — Filters chip text | `text-orange-700` | `text-[#7a3908]` |
| Line 264 — Target icon | `text-orange-600` | `text-[#c8620a]` |

---

## 2. Typography

All fonts are loaded. None are applied to headings in 3106 content.

**File: `app/globals.css` — add after line 463 (after last variant-page ordering rule)**

```css
/* 3106 — apply display font to content headings */
body:not([data-variant]) .variant-page h1,
body:not([data-variant]) .variant-page h2 {
  font-family: var(--font-dashboard-display), 'Avenir Next', sans-serif;
  letter-spacing: -0.02em;
}
```

`body:not([data-variant])` targets only 3106 (the "middle" theme sets no data-variant attribute). This does not touch any variant.

**File: `app/(dashboard)/overview/page.tsx` — metric card value, line 221**

```tsx
// FROM:
<p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>

// TO:
<p className="mt-1 text-4xl font-semibold text-[#1a1208] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
```

Numbers in mono with tabular-nums. Size bump from 3xl to 4xl. The density reads like an instrument, not a SaaS widget.

---

## 3. Layout / Spacing

### Sidebar brand block

**File: `components/layout/Sidebar.tsx`, line 63**

```tsx
// FROM:
<div className="variant-sidebar-brand mb-6 flex items-center justify-between rounded-2xl p-4">

// TO:
<div className="variant-sidebar-brand mb-6 flex items-center justify-between rounded-xl px-4 py-3">
```

Tighter, less badge-like. The espresso color from the new `--variant-brand-bg` handles the identity.

**Line 66 — h1 wordmark:**

```tsx
// FROM:
<h1 className="text-lg font-semibold">Co-Working</h1>

// TO:
<h1 className="text-lg font-semibold tracking-tight">Co-Working</h1>
```

### Overview hero section

**File: `app/(dashboard)/overview/page.tsx`, line 61**

The current gradient blends orange into green (`to-[#eef8f4]`). Remove the green entirely.

```tsx
// FROM:
<section className="rounded-3xl border border-[#e8dac2] bg-gradient-to-br from-[#fff2df] via-[#fff7ed] to-[#eef8f4] p-6 shadow-sm sm:p-8">

// TO:
<section className="rounded-3xl border border-[#dfc9a0] bg-gradient-to-br from-[#fef3e3] to-[#fdecd4] p-6 shadow-sm sm:p-8">
```

### Metric cards

**File: `app/(dashboard)/overview/page.tsx`, `MetricCard` component, line 218**

Add left-border accent and warm background — gives cards a signal without noise.

```tsx
// FROM:
<div className="rounded-2xl border border-[#e7dcc8] bg-white p-4 shadow-sm sm:p-5">

// TO:
<div className="rounded-2xl border border-[#dfc9a0] border-l-4 border-l-[#c8620a] bg-[#fffaf2] p-4 shadow-sm sm:p-5">
```

### Focus Queue task items

**File: `app/(dashboard)/overview/page.tsx`, line 142**

Add micro-lift on hover to signal interactivity.

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

---

## 4. Features / Interactions Worth Pulling

### Addition 1: Global Status Bar (from V2 - The Cockpit)

V2's bottom status bar (`ACTIVE 5 | BLOCKED 1 | URGENT 1 | IDEAS 3 | UNREAD 2`) is the highest-value peripheral awareness feature across all versions. Always visible, zero navigation cost.

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
    <div className="fixed bottom-0 left-72 right-0 z-10 hidden border-t border-[#d4c4a8] bg-[rgba(246,238,222,0.96)] backdrop-blur lg:flex">
      <div className="flex h-9 items-center gap-5 px-8 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums">
        <span>
          <span className="font-semibold text-[#1a1208]">{active}</span> active
        </span>
        <span className="text-[#d4c4a8]">·</span>
        <span className={blocked > 0 ? 'text-red-700' : ''}>
          <span className={`font-semibold ${blocked > 0 ? 'text-red-700' : 'text-[#1a1208]'}`}>{blocked}</span> blocked
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

**Update: `app/(dashboard)/layout.tsx`**

```tsx
// Add import at top:
import { StatusBar } from '@/components/layout/StatusBar'

// Inside DashboardShell return, change:
<main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

// To:
<main className="flex-1 p-4 pb-12 sm:p-6 sm:pb-12 lg:p-8 lg:pb-12">{children}</main>
<StatusBar />
```

---

### Addition 2: CMD+K Command Palette (component exists — just wire it)

`components/variants/shared/CommandPalette.tsx` is built. V1 and V6 use it. 3106 does not. This is a 3-line add.

**Update: `app/(dashboard)/layout.tsx`**

```tsx
// Add import:
import { CommandPalette } from '@/components/variants/shared/CommandPalette'

// Inside DashboardShell, before the closing </div>, add:
<CommandPalette />
```

**Update: `components/layout/Header.tsx` — add CMD+K badge before the Reset button (line 60)**

```tsx
// Add before the Reset button:
<kbd className="hidden items-center gap-1 rounded-lg border border-[#d4c4a8] bg-[rgba(255,250,242,0.9)] px-2.5 py-1.5 text-xs font-medium text-[#6b5c48] lg:inline-flex">
  <span className="text-[10px]">⌘</span>K
</kbd>
```

---

### Addition 3: Momentum Score on Overview (component exists — just render it)

`components/variants/shared/MomentumScore.tsx` is built. V5 and V6 use it. Gives the dashboard a health signal at a glance, earns its place as a 5th metric.

**Update: `app/(dashboard)/overview/page.tsx`**

1. Add import at top:
```tsx
import { MomentumScore } from '@/components/variants/shared/MomentumScore'
```

2. Change the metrics grid from 4-column to 5-column (line 94):
```tsx
// FROM:
<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

// TO:
<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
```

3. Add after the last `<MetricCard>` (after line 118, before closing `</section>`):
```tsx
<div className="rounded-2xl border border-[#dfc9a0] border-l-4 border-l-[#c8620a] bg-[#fffaf2] p-4 shadow-sm sm:p-5">
  <MomentumScore compact />
</div>
```

If `MomentumScore` does not accept a `compact` prop, render it directly and wrap as needed. Check `components/variants/shared/MomentumScore.tsx` for the component's prop interface first.

---

## Execution Order

Run in this sequence — each step is independent except where noted.

1. `app/globals.css` — replace `:root` block (color variables)
2. `app/globals.css` — add typography rule for 3106 headings (after line 463)
3. `app/(dashboard)/overview/page.tsx` — all color replacements + hero gradient + metric card classes + focus queue hover + metric value font
4. `app/(dashboard)/kanban/page.tsx` — all color replacements
5. `components/layout/Sidebar.tsx` — brand block padding + h1 tracking
6. `components/layout/StatusBar.tsx` — create new file
7. `components/layout/Header.tsx` — add CMD+K kbd chip
8. `app/(dashboard)/layout.tsx` — import + render StatusBar + CommandPalette, add pb-12 to main

---

## What Was Considered and Rejected

- **Pulling V1's horizontal scroll focus queue** into 3106: V1's queue works because it's the primary content of a single-page view. In 3106's overview, the focus queue sits beside Current Friction in a two-column grid. Horizontal scroll there creates a UX conflict. Not worth it.
- **V3's mode dock (PLAN / EXECUTE / REVIEW)**: V3 is a single-page app with three modes as its core mechanic. 3106 is already multi-page — each page is effectively a mode. Adding a mode dock duplicates the sidebar navigation.
- **V4's map view**: Different paradigm entirely. Not portable to a multi-page shell.
- **V5's card transitions (Framer Motion)**: V5's entire UX is the card-flip metaphor. The overhead of adding Framer Motion to 3106 for page transitions exceeds the benefit given the existing `variantFade` animation in globals.css already handles page entry.
