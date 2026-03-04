# 3108 Iteration 2 — Color + Space

Apply these changes to `/Users/David/davidai/projects/co-working-dashboard-v2` (the 3108 repo).
Run in-place — no new copy needed. Restart dev server after globals.css changes.

---

## PART 1: Color System

The current palette (`#f3ead9` shell + `#c8620a` accent everywhere) reads as warm-beige SaaS.
The fix: near-white shell so cards read as actual foreground. Accent used in 3 places only: primary CTA, active nav, status pills. Everything else is neutral.

### `app/globals.css` — replace entire `:root` block

```css
:root {
  --background: #FAF9F7;
  --foreground: #1C1714;
  --surface: #FFFFFF;
  --surface-strong: #FFFFFF;
  --muted: #7A6F65;
  --border: #E8E2D8;
  --accent: #C8620A;
  --accent-strong: #A04D06;
  --accent-soft: #FEF3E2;
  --ring: #0F766E;

  --font-dashboard-sans: var(--font-space-grotesk);
  --font-dashboard-display: var(--font-bricolage);
  --font-dashboard-mono: var(--font-plex-mono);

  --font-display: var(--font-newsreader), Georgia, serif;
  --font-editorial: var(--font-fraunces), Georgia, serif;
  --font-data: var(--font-jetbrains-mono), monospace;
  --font-body: var(--font-inter), system-ui, sans-serif;

  --variant-shell-bg: #FAF9F7;
  --variant-main-bg: transparent;
  --variant-header-bg: rgba(250, 249, 247, 0.96);
  --variant-sidebar-bg: rgba(250, 249, 247, 0.96);
  --variant-brand-bg: linear-gradient(135deg, #18120C 0%, #2A1C10 100%);
  --variant-brand-text: #F5E8D4;
  --variant-border-strong: #E8E2D8;
  --variant-card-bg: #FFFFFF;
  --variant-chip-bg: #FEF3E2;
  --variant-chip-text: #7A3908;
  --variant-nav-idle: #4A3620;
  --variant-nav-active-bg: rgba(200, 98, 10, 0.08);
  --variant-nav-active-text: #7A3908;
  --variant-accent: #C8620A;
  --variant-accent-strong: #A04D06;
}
```

### `app/globals.css` — update `.variant-nav-link-active` rule

```css
.variant-nav-link-active {
  border-color: var(--variant-border-strong);
  background: var(--variant-nav-active-bg);
  color: var(--variant-nav-active-text);
  box-shadow: none;
}
```

Remove the `box-shadow` — on a light bg it reads as noise, not depth.

---

## PART 2: Accent Reduction

The accent color currently appears on: icon backgrounds, card borders, gradient backgrounds, buttons, chips, status pills, status bar. That's 8+ uses per page. Halve it.

**Rule: accent only on (1) primary CTA buttons, (2) active nav item, (3) semantic status pills (urgent/blocked). Everything else goes neutral.**

### Overview page — remove accent from supporting elements

**`app/(dashboard)/overview/page.tsx`**

`MetricCard` component — remove the left border accent and change icon bg to neutral:
```tsx
// FROM:
<div className="rounded-2xl border border-[#dfc9a0] border-l-4 border-l-[#c8620a] bg-[#fffaf2] p-4 shadow-sm sm:p-5">
  <div className="mb-2 inline-flex rounded-lg bg-[#fde8d0] p-2 text-[#7a3908]">{icon}</div>

// TO:
<div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm sm:p-5">
  <div className="mb-2 inline-flex rounded-lg bg-[#F5F4F2] p-2 text-[#7A6F65]">{icon}</div>
```

Focus Queue task items — neutral border, no amber hover:
```tsx
// FROM:
<li className="rounded-xl border border-[#e4d2b8] bg-[#fffdf8] p-4 transition-all hover:border-[#c8a880] hover:shadow-sm hover:-translate-y-px">

// TO:
<li className="rounded-xl border border-[#E8E2D8] bg-white p-4 transition-all hover:border-[#D0C8BE] hover:shadow-sm hover:-translate-y-px">
```

Current Friction rows — replace amber/green/blue rows with semantic colors:
```tsx
// FROM:
<p className="rounded-lg bg-[#fde8d0] px-3 py-2">
  <span className="font-semibold text-[#7a3908]">{blockedTasks.length}</span> blocked tasks
</p>
<p className="rounded-lg bg-[#f2fbf7] px-3 py-2">
  <span className="font-semibold text-emerald-700">{unreadArticles.length}</span> unread articles
</p>
<p className="rounded-lg bg-[#f4f8ff] px-3 py-2">
  <span className="font-semibold text-blue-700">{...}</span> open ideas in funnel
</p>

// TO:
<p className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-[#1C1714]">
  <span className={`font-semibold ${blockedTasks.length > 0 ? 'text-red-700' : 'text-[#1C1714]'}`}>
    {blockedTasks.length}
  </span>{' '}
  blocked tasks
</p>
<p className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-[#1C1714]">
  <span className="font-semibold text-[#1C1714]">{unreadArticles.length}</span> unread articles
</p>
<p className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-[#1C1714]">
  <span className="font-semibold text-[#1C1714]">{data.ideas.filter(i => i.status !== 'shipped').length}</span> open ideas
</p>
```

Hero section — strip the orange gradient down to a very subtle warm tint:
```tsx
// FROM:
<section className="rounded-3xl border border-[#dfc9a0] bg-gradient-to-br from-[#fef3e3] to-[#fdecd4] ...">

// TO:
<section className="rounded-3xl border border-[#E8E2D8] bg-white ...">
```

The hero doesn't need to be tinted. Pure white card on `#FAF9F7` shell already reads as the primary content area.

MomentumHero — match:
```tsx
// FROM:
<div className="shrink-0 rounded-2xl border border-[#dfc9a0] bg-white/60 p-5 text-right">

// TO:
<div className="shrink-0 rounded-2xl border border-[#E8E2D8] bg-[#FAFAF9] p-5 text-right">
```

---

## PART 3: Space Optimization

### Fix 1 — Header: one line, date inline

**`components/layout/Header.tsx`** — replace the title section (lines 47–56):

```tsx
// FROM:
<div>
  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{today}</p>
  <div className="flex items-center gap-2">
    <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
    {!isMiddle ? (
      <span className="variant-pill hidden rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex">
        {theme.shortName}
      </span>
    ) : null}
  </div>
</div>

// TO:
<div className="flex items-baseline gap-3">
  <h2 className="text-lg font-semibold text-[#1C1714] sm:text-xl">{title}</h2>
  <span className="hidden text-xs uppercase tracking-[0.18em] text-[#7A6F65] sm:block">{today}</span>
</div>
```

This frees ~20px of vertical header height and makes the header a single scannable line.

---

### Fix 2 — Overview: "View all N →" at bottom of Focus Queue

**`app/(dashboard)/overview/page.tsx`** — add after the `</ul>` closing tag of the Focus Queue task list (after line 166, before `</article>`):

```tsx
<div className="mt-4 flex items-center justify-between border-t border-[#E8E2D8] pt-3">
  <span className="text-xs text-[#7A6F65]">{activeTasks.length} active tasks total</span>
  <Link href="/kanban" className="text-xs font-medium text-[#C8620A] hover:underline">
    View all →
  </Link>
</div>
```

---

### Fix 3 — Overview: Current Friction needs more weight than Recent Activity

Currently they're identical cards stacked in the right column. Current Friction requires action; Recent Activity is a log.

**`app/(dashboard)/overview/page.tsx`** — swap their order in the right column (move Recent Activity below Friction) and give Friction a distinct heading treatment:

```tsx
// Change the Friction heading from:
<h2 className="text-lg font-semibold text-[#1a1208]">Current Friction</h2>
<p className="mb-4 text-sm text-[#6b5c48]">What is slowing execution right now.</p>

// To:
<div className="mb-4 flex items-center justify-between">
  <div>
    <h2 className="text-lg font-semibold text-[#1C1714]">Friction</h2>
    <p className="text-sm text-[#7A6F65]">What needs unblocking now.</p>
  </div>
  {blockedTasks.length > 0 && (
    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      {blockedTasks.length} blocked
    </span>
  )}
</div>
```

---

### Fix 4 — Kanban: collapse form when primary task is showing

**`app/(dashboard)/kanban/page.tsx`**

Add state at the top of `KanbanPage`:
```tsx
const [formExpanded, setFormExpanded] = useState(false)
```

Replace the full form section with a collapsible version:

```tsx
<section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Task Board</h1>
      <p className="mt-1 text-sm text-[#7A6F65]">
        Capture quickly, prioritize clearly, and move work from chaos to done.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <div className="hidden rounded-xl bg-[#FEF3E2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A3908] sm:block">
        Local-first mode
      </div>
    </div>
  </div>

  {!formExpanded ? (
    <button
      type="button"
      onClick={() => setFormExpanded(true)}
      className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#E8E2D8] px-4 py-3 text-sm text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
    >
      <Plus className="h-4 w-4" />
      Add a task...
    </button>
  ) : (
    <form onSubmit={handleCreateTask} className="space-y-3">
      {/* ... existing form fields unchanged, but add a cancel button ... */}
      {/* After the Add Task button, add: */}
      <button
        type="button"
        onClick={() => setFormExpanded(false)}
        className="ml-2 text-sm text-[#7A6F65] hover:text-[#1C1714]"
      >
        Cancel
      </button>
    </form>
  )}
</section>
```

The existing form JSX (lines 121–215) slots inside the `formExpanded` branch unchanged. Just wrap it.

---

### Fix 5 — Kanban: replace static "Execution rule" with computed context

**`app/(dashboard)/kanban/page.tsx`** — replace the static Execution rule sidebar card (lines 283–288):

```tsx
// FROM:
<div className="rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
  <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Execution rule</h2>
  <p className="text-sm text-slate-600">
    Keep backlog thin. Promote only what you plan to execute in the next 72 hours.
  </p>
</div>

// TO:
<div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Queue health</h2>
  <div className="space-y-2 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-[#7A6F65]">Backlog</span>
      <span className="font-semibold text-[#1C1714]">
        {filteredTasks.filter(t => t.status === 'backlog').length}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[#7A6F65]">In progress</span>
      <span className="font-semibold text-[#1C1714]">
        {filteredTasks.filter(t => t.status === 'in_progress').length}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className={filteredTasks.filter(t => t.status === 'blocked').length > 0 ? 'text-red-700' : 'text-[#7A6F65]'}>
        Blocked
      </span>
      <span className={`font-semibold ${filteredTasks.filter(t => t.status === 'blocked').length > 0 ? 'text-red-700' : 'text-[#1C1714]'}`}>
        {filteredTasks.filter(t => t.status === 'blocked').length}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[#7A6F65]">Done this session</span>
      <span className="font-semibold text-[#1C1714]">
        {filteredTasks.filter(t => t.status === 'done').length}
      </span>
    </div>
  </div>
</div>
```

---

### Fix 6 — Reading: content before forms

**`app/(dashboard)/reading/page.tsx`**

Currently: hero card with two forms on top, list/content below.
Flip it: move the two-panel content section to appear first (it contains the reading list and articles), push the form card to the bottom or collapse it behind a button.

The easiest structural change: in the page's JSX, move the `<section>` containing `CREATE LIST` / `ADD ARTICLE` forms to after the content section. If the forms are a separate section from the list/article panel, just reorder the JSX sections:

```tsx
// Reorder from:
// 1. JourneyPanel
// 2. Forms card (CREATE LIST + ADD ARTICLE)
// 3. Two-panel (list sidebar + article view)

// To:
// 1. JourneyPanel
// 2. Two-panel (list sidebar + article view)  ← content first
// 3. Forms card (CREATE LIST + ADD ARTICLE)   ← create last
```

If the forms and content are in the same section, split them into two `<section>` elements and reorder.

---

### Fix 7 — Activity: denser timeline with date grouping

**`app/(dashboard)/activity/page.tsx`**

The current layout has 3 events in a large white card with a lot of void. Two changes:

**A. Group events by date with a date separator:**

```tsx
// After the activities list is rendered, group by date:
// At top of component, add:
const groupedActivities = useMemo(() => {
  return data.activities.reduce<Record<string, typeof data.activities>>((groups, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(activity)
    return groups
  }, {})
}, [data.activities])
```

**B. Replace the flat list with grouped timeline:**

```tsx
{Object.entries(groupedActivities).map(([date, activities]) => (
  <div key={date}>
    <div className="mb-2 mt-4 flex items-center gap-3 first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">{date}</span>
      <div className="flex-1 border-t border-[#E8E2D8]" />
    </div>
    <div className="space-y-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-[#FAFAF9]">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D0C8BE]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#1C1714]">{activity.message}</p>
            <p className="mt-0.5 text-xs text-[#7A6F65]">
              {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {/* tags on right */}
        </div>
      ))}
    </div>
  </div>
))}
```

**C. Empty state when no activities:**

```tsx
{data.activities.length === 0 && (
  <div className="py-12 text-center">
    <p className="text-sm font-medium text-[#1C1714]">No activity yet</p>
    <p className="mt-1 text-xs text-[#7A6F65]">Actions across the workspace will appear here as you work.</p>
  </div>
)}
```

---

### Fix 8 — Ideas: compress empty columns

**`app/(dashboard)/ideas/page.tsx`**

Change the column grid from equal-width columns to flex with minimum widths:

Find the pipeline grid container (the div wrapping BRAINSTORM / RESEARCH / IN PROGRESS / SHIPPED columns) and change:

```tsx
// FROM (something like):
<div className="grid grid-cols-4 gap-4">

// TO:
<div className="flex gap-4 overflow-x-auto">
```

Each column card should have:
```tsx
className="... min-w-[200px] flex-1"
```

An empty Shipped column will naturally compress because `flex-1` distributes remaining space. The populated columns will take proportionally more width.

Additionally, inside the Shipped column, when `ideas.length === 0`, reduce its minimum width:
```tsx
className={`... ${ideas.length === 0 ? 'min-w-[140px] max-w-[180px] opacity-60' : 'min-w-[200px] flex-1'}`}
```

---

### Fix 9 — Projects: 0% progress bar → hide when empty

**`app/(dashboard)/projects/page.tsx`** or **`components/projects/ProjectCard.tsx`**

Find the progress bar render and conditionally hide it at 0:

```tsx
// FROM:
<div>
  <p className="text-xs ...">Completion</p>
  <div className="...progress bar...">
    <div style={{ width: `${completion}%` }} />
  </div>
</div>

// TO:
<div>
  <p className="text-xs text-[#7A6F65]">
    Completion
    {completion === 0 ? (
      <span className="ml-2 text-[#7A6F65]">—</span>
    ) : (
      <span className="ml-2 font-semibold text-[#1C1714]">{completion}%</span>
    )}
  </p>
  {completion > 0 && (
    <div className="mt-1 h-1 w-full rounded-full bg-[#E8E2D8]">
      <div
        className="h-1 rounded-full bg-[#C8620A] transition-all"
        style={{ width: `${completion}%` }}
      />
    </div>
  )}
  {completion === 0 && (
    <div className="mt-1 h-1 w-full rounded-full border border-dashed border-[#D0C8BE]" />
  )}
</div>
```

---

### Fix 10 — CMD+K palette: warm theme

**`components/variants/shared/CommandPalette.tsx`**

The palette opens near-black on a warm-white app. Change to espresso warm:

```tsx
// The main palette container, FROM:
<div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#101010] text-white shadow-2xl">

// TO:
<div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#3A2A1E] bg-[#1C1208] text-[#F5E8D4] shadow-2xl">
```

Input area border, FROM `border-white/10` → TO `border-[#3A2A1E]`
Title area, FROM `text-white/45` → TO `text-[#9A8070]`
Input placeholder, FROM `placeholder:text-white/45` → TO `placeholder:text-[#7A6050]`
Active row bg, FROM `bg-white/10` → TO `bg-[#2E1E12]`
Hover row bg, FROM `hover:bg-white/5` → TO `hover:bg-[#251508]`
ESC badge border, FROM `border-white/20` → TO `border-[#4A3020]`
ESC badge text, FROM `text-white/60` → TO `text-[#9A8070]`
Description text, FROM `text-white/60` → TO `text-[#9A8070]`

---

### Fix 11 — Reading: rename ambiguous action buttons

**`app/(dashboard)/reading/page.tsx`**

```tsx
// FROM:
<button>Mark reading</button>
<button>Mark read</button>

// TO:
<button>Start reading</button>
<button>Mark complete</button>
```

---

## Execution Order

1. `app/globals.css` — replace `:root` block (all color vars)
2. `app/globals.css` — update `.variant-nav-link-active` (remove box-shadow)
3. `components/layout/Header.tsx` — single-line date + title
4. `components/variants/shared/CommandPalette.tsx` — warm theme
5. `app/(dashboard)/overview/page.tsx` — hero → white card, metric cards → neutral, friction rows → neutral, momentum box → neutral, "View all →" link, Friction heading weight
6. `app/(dashboard)/kanban/page.tsx` — collapsible form, computed Queue Health sidebar, color sweep
7. `app/(dashboard)/reading/page.tsx` — reorder sections (content first), rename buttons
8. `app/(dashboard)/activity/page.tsx` — grouped timeline, empty state
9. `app/(dashboard)/ideas/page.tsx` — flex columns, compress empty Shipped
10. `app/(dashboard)/projects/page.tsx` / `components/projects/ProjectCard.tsx` — hide 0% bar

Color sweep across all pages (find-replace, independent of above):

| Old | New |
|---|---|
| `border-[#d4c4a8]`, `border-[#dfc9a0]`, `border-[#e6dac6]` | `border-[#E8E2D8]` |
| `bg-[#fffaf2]`, `bg-[#fdf7ee]`, `bg-[#fffcf8]`, `bg-[#fffdf8]` | `bg-white` |
| `text-[#6b5c48]`, `text-[#4a3620]` | `text-[#7A6F65]` |
| `text-[#1a1208]`, `text-[#2d1e12]` | `text-[#1C1714]` |
| `border-[#dfc9a0]` | `border-[#E8E2D8]` |
| `bg-[#fde8d0]` (non-CTA uses) | `bg-[#F5F4F2]` |
| `text-[#7a3908]` (non-status uses) | `text-[#7A6F65]` |
