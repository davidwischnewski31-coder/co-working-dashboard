# 3108 Iteration 3 — Polish + Consistency

Apply these changes to `/Users/David/davidai/projects/co-working-dashboard-v2` (the 3108 repo).

---

## What Landed in Iteration 2

These things are working — don't touch them:

- Light and Airy palette. Cards read as foreground on `#FAF9F7` shell. Clean.
- Single-line header with date inline.
- Grouped Activity timeline with date separators.
- Content-first Reading layout.
- Ideas flex columns — compressed Shipped column.
- Projects dashed placeholder for 0% completion.
- Kanban collapsible form + Queue Health sidebar.
- Status bar across all pages.
- Semantic status pills (red = urgent/blocked, slate = neutral).

---

## What Still Needs Fixing

### Problem 1 — Ideas: "Advance" accent overuse

3 orange filled `Advance →` buttons appear simultaneously across the Brainstorm / Research / In Progress columns. That's 3 high-contrast CTAs competing at once. Violates the 3-uses-max accent rule and creates noise.

The "Advance" action is real but not urgent — it's a progression control, not a primary commitment. Treat it as secondary.

**Fix:** Downgrade to ghost/outline button. Transition to accent on hover only.

**`app/(dashboard)/ideas/page.tsx`** — find the Advance button (in the idea card map):

```tsx
// FROM:
className="inline-flex items-center gap-1 rounded-md bg-[#C8620A] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A04D06] disabled:cursor-not-allowed disabled:bg-[#E8E2D8] disabled:text-[#7A6F65]"

// TO:
className="inline-flex items-center gap-1 rounded-md border border-[#D0C8BE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A] disabled:cursor-not-allowed disabled:opacity-40"
```

---

### Problem 2 — Ideas + Projects: create form always expanded

The Kanban page nailed the pattern: a dashed "Add a task..." trigger that expands to the full form. Ideas and Projects still show their full 4-column form grids on page load, burning 80–100px of top space every visit.

Apply the same collapsible treatment to both pages.

#### **`app/(dashboard)/ideas/page.tsx`**

Add state at top of component:
```tsx
const [formExpanded, setFormExpanded] = useState(false)
```

Wrap the existing `<form>` in the create card with a collapsible:

```tsx
// Replace the form section inside the "Ideas Pipeline" card with:
{!formExpanded ? (
  <button
    type="button"
    onClick={() => setFormExpanded(true)}
    className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#E8E2D8] px-4 py-3 text-sm text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
  >
    <Plus className="h-4 w-4" />
    Capture an idea...
  </button>
) : (
  <>
    {/* existing form JSX unchanged */}
    {/* add cancel button after the Add button: */}
    <button
      type="button"
      onClick={() => setFormExpanded(false)}
      className="text-sm text-[#7A6F65] hover:text-[#1C1714]"
    >
      Cancel
    </button>
  </>
)}
```

In `handleCreateIdea`, after the resets, add:
```tsx
setFormExpanded(false)
```

#### **`app/(dashboard)/projects/page.tsx`**

Same pattern. Add state:
```tsx
const [formExpanded, setFormExpanded] = useState(false)
```

Replace the form section inside the "Projects" card:

```tsx
{!formExpanded ? (
  <button
    type="button"
    onClick={() => setFormExpanded(true)}
    className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#E8E2D8] px-4 py-3 text-sm text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
  >
    <Plus className="h-4 w-4" />
    Start a new project...
  </button>
) : (
  <>
    {/* existing form JSX unchanged */}
    <button
      type="button"
      onClick={() => setFormExpanded(false)}
      className="text-sm text-[#7A6F65] hover:text-[#1C1714]"
    >
      Cancel
    </button>
  </>
)}
```

In `handleCreateProject`, after the resets, add:
```tsx
setFormExpanded(false)
```

---

### Problem 3 — Activity: browser-default filter selects

The "All actors" and "All entities" dropdowns render as raw `<select>` elements — native OS styling, no arrow icon control, no visual consistency with the rest of the app.

**`app/(dashboard)/activity/page.tsx`** — wrap each `<select>` in a custom container:

```tsx
// FROM (each select):
<select
  value={actorFilter}
  onChange={(event) => setActorFilter(event.target.value as 'all' | OwnerType)}
  className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#7A6F65]"
>

// TO:
<div className="relative">
  <select
    value={actorFilter}
    onChange={(event) => setActorFilter(event.target.value as 'all' | OwnerType)}
    className="appearance-none rounded-lg border border-[#E8E2D8] bg-white py-2 pl-3 pr-8 text-sm text-[#7A6F65] outline-none transition focus:border-[#C8620A]"
  >
    {/* options unchanged */}
  </select>
  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A6F65]" />
</div>
```

Add `ChevronDown` to the lucide-react import line.

Apply the same wrapper to the entity filter select.

---

### Problem 4 — Activity: arrow icon creates false link affordance

Each activity row ends with `moved →`, `completed →`, `updated →` using the `ArrowRight` icon. The arrow implies the row is clickable (a navigation trigger). It isn't. This is a false affordance.

**`app/(dashboard)/activity/page.tsx`** — in the activity row render, remove the arrow from the action tag:

```tsx
// FROM:
<span className="inline-flex items-center gap-0.5 text-[11px] text-[#7A6F65]">
  {activity.action}
  <ArrowRight className="h-2.5 w-2.5" />
</span>

// TO:
<span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
  {activity.action}
</span>
```

Now the action tag visually matches the entity type tag (same pill style), and there's no spurious arrow.

Remove `ArrowRight` from the lucide-react import if it's no longer used elsewhere in this file.

---

### Problem 5 — Reading: ambiguous button hierarchy

The article view shows three buttons: `Start reading`, `Mark complete`, `Archive`. No visual hierarchy — all three look like siblings. The user's eye doesn't know where to go.

Rules for article action buttons based on `article.status`:
- If `status === 'unread'`: primary = **Start reading** (filled), secondary = **Archive** (ghost)
- If `status === 'reading'`: primary = **Mark complete** (filled), secondary = **Archive** (ghost), tertiary = no start button needed
- If `status === 'read'` / archived: no primary CTA, just info

**`app/(dashboard)/reading/page.tsx`** — update the article action buttons render:

```tsx
// Replace the three-button group with:
<div className="flex items-center gap-2">
  {article.status === 'unread' && (
    <button
      onClick={() => markReading(article.id)}
      className="rounded-lg bg-[#C8620A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A04D06]"
    >
      Start reading
    </button>
  )}
  {article.status === 'reading' && (
    <button
      onClick={() => markRead(article.id)}
      className="rounded-lg bg-[#C8620A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A04D06]"
    >
      Mark complete
    </button>
  )}
  {article.status !== 'archived' && (
    <button
      onClick={() => archiveArticle(article.id)}
      className="rounded-lg border border-[#E8E2D8] px-3 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#D0C8BE]"
    >
      Archive
    </button>
  )}
</div>
```

If the component uses different function names (e.g., `handleMarkReading`, `handleMarkRead`), match accordingly. The exact function names don't change — only the conditional rendering and button styles.

---

### Problem 6 — Projects: cards have no action

Project cards are static articles. No way to navigate to project-filtered tasks. Every card ends with "Updated [date]" — a dead end.

**`app/(dashboard)/projects/page.tsx`** — add a footer row to each project card:

```tsx
// Add after the <dl> stats grid and before closing </article>:
<div className="mt-4 flex items-center justify-between border-t border-[#E8E2D8] pt-3">
  <p className="text-xs text-[#7A6F65]">Updated {formatDate(project.updated_at)}</p>
  <Link
    href={`/kanban?project=${project.id}`}
    className="text-xs font-medium text-[#C8620A] hover:underline"
  >
    View tasks →
  </Link>
</div>
```

Remove the standalone `<p className="text-xs text-[#7A6F65]">Updated {formatDate(project.updated_at)}</p>` that currently sits below the stats grid (to avoid duplication).

Add `Link` to the imports: `import Link from 'next/link'`

Note: The `/kanban?project=` filter query param won't automatically work unless the Kanban page reads it. For now this just adds the link — wiring the filter is a separate task.

---

### Problem 7 — Header: "Reset Demo Data" button

Every page shows `Reset Demo Data` in the top-right. This is a dev artifact. It breaks the product illusion for any client-facing or demo use.

**Wherever this renders** — find the Header component or layout that renders the reset button and change its visibility to dev-only, or style it as a minimal text link:

```tsx
// FROM (something like):
<button className="... rounded-lg border ... text-sm ...">Reset Demo Data</button>

// TO:
<button className="text-xs text-[#C4B8A8] underline-offset-2 hover:text-[#7A6F65] hover:underline">
  Reset
</button>
```

This makes it visually recede without removing the functionality.

---

### Problem 8 — Kanban: primary task warm gradient

The linter added `bg-gradient-to-br from-[#FFF6E9] via-[#FFF2DF] to-[#FDE7CB]` to the primary task hero card. It's subtle but re-introduces the amber-tinted card pattern the palette redesign moved away from. A clear visual treatment that doesn't use color:

**`app/(dashboard)/kanban/page.tsx`** — find the primary task hero card and replace the gradient bg:

```tsx
// FROM:
className="... bg-gradient-to-br from-[#FFF6E9] via-[#FFF2DF] to-[#FDE7CB] ..."

// TO:
className="... border-l-4 border-l-[#C8620A] bg-white ..."
```

A 4px orange left border on a white card signals "this is the active item" without flooding the viewport with warm amber.

---

## Execution Order

1. `app/(dashboard)/ideas/page.tsx` — collapsible form (Problem 2)
2. `app/(dashboard)/projects/page.tsx` — collapsible form + "View tasks →" link (Problems 2 + 6)
3. `app/(dashboard)/ideas/page.tsx` — Advance button → ghost style (Problem 1)
4. `app/(dashboard)/activity/page.tsx` — custom select wrappers (Problem 3)
5. `app/(dashboard)/activity/page.tsx` — remove ArrowRight from action tags (Problem 4)
6. `app/(dashboard)/reading/page.tsx` — conditional button hierarchy (Problem 5)
7. `app/(dashboard)/kanban/page.tsx` — replace gradient with left border on primary task (Problem 8)
8. Header/layout — "Reset Demo Data" → minimal text (Problem 7)

---

## Accent Count After Iteration 3

| Use | Before iter 2 | After iter 2 | After iter 3 |
|---|---|---|---|
| Primary CTA buttons | ✓ | ✓ | ✓ |
| Active nav item | ✓ | ✓ | ✓ |
| Status pills (urgent/blocked) | ✓ | ✓ | ✓ |
| Idea "Advance" buttons (×3) | — | ✓ (added by linter) | removed |
| Primary task hero gradient | — | ✓ (added by linter) | removed |
| Reading list selected item | ✓ | ✓ | ✓ (keep — selection state is semantic) |
| "View tasks →" link (new) | — | — | ✓ (small, 1 per visible card) |

Net: down from ~8 accent uses per page to 4–5. Within budget.
