# V6 - "The Command" - Synthesis Handover for Codex
## Elon Musk × Jony Ive × Voldemort Creative Brief

**Date:** 2026-02-23
**Port:** `3107`
**Source material:** V1–V5 built variants at ports 3101–3105 (reviewed post-build)
**Supersedes:** Individual variant handovers. This is the product, not an experiment.

---

## The Verdict on V1–V5

**Musk:** Five variants proved five things. V1 proved the newspaper layout works. V2 proved the status bar and keyboard shortcuts work. V3 proved mode-based focus beats page navigation. V4 proved spatial dependency visualization is the right mental model. V5 proved adaptive card ordering beats manual navigation. Now stop proving things. Ship one product that takes the best of all five and kills everything else.

**Ive:** The five variants are sketches. You don't ship all your sketches - you find the one line in each that's true, then draw a new thing from those lines. V1's truth: the command palette replaces navigation. V2's truth: a live status bar makes a dashboard feel alive. V3's truth: a mode that matches what you're trying to do right now. V4's truth: relationships between things must be visible, not inferred. V5's truth: one thing at a time, full attention, full screen. V6 holds all five truths simultaneously.

**Voldemort:** Five variants is five things to maintain, five things to confuse users with, and five failure surfaces. Kill four. The question is which one survives. None of them do, cleanly. So: take the minimum viable insight from each, combine into one interface, and ship. Everything else is either not built correctly yet (V4's zoom levels, V5's card transitions) or shouldn't have been built as a separate variant at all. Two modes: FOCUS and ORBIT. One command palette. One status bar. Done.

---

## Core Concept

**V6 "The Command":** A two-mode interface. Not five pages, not five variants. Two states that answer two different questions:

- **FOCUS mode:** "What do I do right now?" — Single-task, full attention, morning brief, execution context.
- **ORBIT mode:** "What is the state of the system?" — Spatial canvas, dependency map, all entities visible at once.

A floating dock at the bottom center switches modes. The Command Palette (`Cmd+K`) handles all navigation, search, and creation in both modes. The status bar at the bottom is always visible in both modes.

The user wakes up in FOCUS mode. They switch to ORBIT when they need to reason about the bigger picture. They return to FOCUS to act. This is the workflow.

---

## Running V6

```bash
npm run dev:v6
```

Port: `3107`
Variant env: `NEXT_PUBLIC_DASHBOARD_VARIANT=v6`
Variant component: `components/variants/v6/CommandDashboard.tsx`

---

## Typography System

Four typefaces. Each has one job.

| Typeface | Source | Job | Where |
|---|---|---|---|
| **Newsreader** | Google Fonts | Hero display — the task/project you're looking at | Primary task title in FOCUS (40–52px), card titles in ORBIT zoom-in |
| **Fraunces** | Google Fonts | Editorial section labels | Section headings, mode name, brief heading |
| **JetBrains Mono** | Google Fonts | Data, counts, time | Status bar, timer, sparklines, timestamps, stats |
| **Inter** | Google Fonts | Body — everything else | Descriptions, labels, inputs, buttons |

Load all four in `app/layout.tsx` via `next/font/google`. Apply via CSS variables:
```css
--font-display: Newsreader, Georgia, serif;
--font-editorial: Fraunces, Georgia, serif;
--font-data: 'JetBrains Mono', monospace;
--font-body: Inter, system-ui, sans-serif;
```

---

## Color System

Two modes, two temperatures. One accent.

### FOCUS mode — Warm Parchment
```
Background:        #F7EFE3  (warm parchment — execute feel)
Surface / cards:   #FFFFFF at 80% opacity, backdrop-blur
Border:            rgba(42, 31, 26, 0.12)
Text primary:      #2A1F1A  (deep warm black)
Text secondary:    rgba(42, 31, 26, 0.55)
Accent:            #F5A623  (amber — used only for interactive/actionable)
```

### ORBIT mode — Deep Charcoal Canvas
```
Background:        #1C1C1E  (deep charcoal — V4's canvas)
Panel surfaces:    #141414
Panel borders:     #222222
Text primary:      #E0E0E0
Text secondary:    #888888
Accent:            #F5A623  (same amber — consistent interactive signal)
Node colors:       project.color from data (only place multi-color is justified)
Edge color:        rgba(255,255,255,0.18) for related, rgba(248,113,113,0.8) for blocking
```

### Shared chrome (dock, status bar, command palette)
```
Dock bg:           rgba(0,0,0,0.55) backdrop-blur
Status bar bg:     #111111 in ORBIT, rgba(42,31,26,0.08) in FOCUS
Accent:            #F5A623 everywhere
```

**Color rule (Ive):** Amber appears ONLY on interactive elements — buttons that cause action, focused panel borders, active states. Never decorative. If you're about to add amber somewhere that isn't clickable, stop.

---

## FOCUS Mode — Full Specification

### Layout

```
+---------------------------------------------------+
|  [MORNING BRIEF — collapsible hero]               |  <- Fraunces display type
|  Today, Feb 23 · Momentum 74 · 3 urgent · 1 blocked  |
+---------------------------------------------------+
|                                                   |
|  PRIMARY TASK AREA (center, full width)           |  <- Newsreader 44px
|                                                   |
|  "Ship responsive shell"                          |
|  Project: Co-Working Dashboard · URGENT · Due tmrw|
|                                                   |
|  [Start]  [Mark Done]  [I'm Blocked]              |
|                                                   |
|  +-- FOCUS TIMER --+  +-- CONTEXT PANEL ---------+|
|  |  25:00  [▶]      |  | Next up                 ||
|  |  Pomodoro        |  | 1. Enable local draft    ||
|  +------------------+  | 2. Review pricing model  ||
|                        | 3. Stakeholder update    ||
|                        |                          ||
|                        | Related reading          ||
|                        | - [article title]        ||
|                        +-------------------------+|
+---------------------------------------------------+
|  STATUS BAR                                       |  <- JetBrains Mono 10px
|  Active 8 | Blocked 1 | Urgent 3 | Momentum ↑74  |  09:32
+---------------------------------------------------+
|              [FOCUS]  [ORBIT]  [⌘K]              |  <- Dock
+---------------------------------------------------+
```

### FOCUS Mode Components

**MorningBrief Hero (collapsible):**
- Fraunces 28px: "Monday, Feb 23"
- JetBrains Mono for stat pills: "3 urgent · 1 blocked · 74 momentum"
- Momentum score from V5's `MomentumScore` component — shown as a single number with trend arrow
- AI-generated summary sentence from V1's `summarizeMorningBrief()`
- CTA: "Start with [most urgent task title]" — clicking collapses the brief and scrolls to task
- Collapses to a slim bar after 30 seconds or on click. Stays collapsed for the session.

**Primary Task Area:**
- Task title: Newsreader, 44px, leading-tight
- Description below, Inter 16px, opacity-70
- Three context chips: Project name, Priority badge, Due date — JetBrains Mono 11px
- Action buttons: [Start] [Mark Done] [I'm Blocked] — rounded-full, amber border on hover only
- Clicking a task in "Next up" replaces the primary task smoothly (framer-motion layout animation, 250ms)

**Focus Timer:**
- Pomodoro: 25 min default, configurable (15/25/45 presets)
- Start/pause with spacebar when FOCUS panel is active
- Displays remaining: JetBrains Mono, 28px
- Resets on task change

**Context Panel (right):**
- "Next up" — top 3 tasks sorted by `sortTasksByUrgency()`, clickable to promote to primary
- "Related reading" — articles from reading lists linked to current task's project (V3 contextual reading logic)
- Both sections are compact — Inter 13px, no scrollbar, just top N

**Keyboard shortcuts in FOCUS mode:**
- `Space` — toggle focus timer
- `Enter` — mark current task in_progress
- `d` — mark current task done
- `b` — mark current task blocked
- `j` — advance to next task in Next up (promotes it to primary)
- `Cmd+K` — command palette
- `Tab` — switch to ORBIT mode
- `?` — shortcut overlay

---

## ORBIT Mode — Full Specification

### Concept

Spatial canvas. All entities visible. Pan, zoom, dependency lines. Three zoom levels — this was the core invention in V4 that was never properly built. Build it now.

### Layout

```
+---------------------------------------------------+
|  [Search input - floating top center]             |
+---------------------------------------------------+
|                                                   |
|         S P A T I A L   C A N V A S               |
|                                                   |
|   [project circle]   [project circle]             |
|         |  task nodes   |  task nodes             |
|   [project circle]                                |
|                                                   |
|                                  +--minimap--+    |
|                                  |           |    |
|                                  +-----------+    |
+---------------------------------------------------+
|  STATUS BAR  Active 8 | Blocked 1 | Urgent 3     |
+---------------------------------------------------+
|              [FOCUS]  [ORBIT]  [⌘K]              |
+---------------------------------------------------+
```

### Three Zoom Levels — NON-NEGOTIABLE

This is the central invention. Build all three or ORBIT is pointless.

**Level 1 — Portfolio (`zoom < 0.65`):**
- Projects appear as large circles (r=52). Size proportional to task count. Color = project.color.
- Project labels below circles: Fraunces 13px
- Ideas appear as small dots (r=8) near their project cluster
- Dependency lines between projects that share blocked tasks (red) or are in same category (white, semi-transparent)
- Task nodes NOT rendered at this zoom — too dense, irrelevant at portfolio level
- Minimap shows colored project circles

**Level 2 — Cluster (`0.65 ≤ zoom < 1.3`):**
- Project circle shrinks to r=32, stays centered
- Task nodes appear around it in a radial cluster (r=90–130)
- Task nodes: r=16, colored by project color at CC opacity
- Kanban columns are spatial REGIONS: backlog tasks cluster left of project center, done tasks cluster right, blocked tasks cluster at bottom with red outline glow
- Dependency blocking edges rendered as red lines between blocked task → candidate task
- Idea nodes: r=10, float at r=160 from project center with slight drift
- Labels appear on all nodes at this zoom

**Level 3 — Task Detail (`zoom ≥ 1.3`):**
- When user zooms into a specific task node, that task auto-selects
- A full-screen detail card slides up (framer-motion, 300ms ease-out) from the canvas, covering ~60% of screen
- Card design: V5's card style — Newsreader 36px title, Inter body, amber action buttons
- [Start] [Done] [Block] buttons directly on card
- "Related tasks" shown as a small horizontal list at card bottom — these are the same-project tasks, clickable to jump to them
- Pressing Escape or clicking away dismisses the card, zooms back to Level 2
- The canvas dims to 30% opacity behind the card

### ORBIT Mode Components

**Canvas:**
- SVG layer for edges (lines)
- Absolutely positioned React nodes over SVG (eliminates SVG text limitation)
- Pan: mouse drag / touch drag on empty canvas space
- Zoom: scroll wheel, pinch, or toolbar buttons (+/-)
- Store: `{ pan: { x, y }, zoom }` in React state
- Smooth zoom animation: use `requestAnimationFrame` interpolation toward target zoom, 150ms
- Double-click empty canvas: creates task attached to nearest project. Shows inline input prompt at click location, not `window.prompt`.

**Node layout — force simulation (install `d3-force`):**
```
npm install d3-force @types/d3-force
```
- Run `d3.forceSimulation()` on mount and when data changes
- Forces: `d3.forceLink()` — connects tasks to their project center (strength 0.5), `d3.forceCollide()` — prevents overlap (radius = nodeRadius + 12), `d3.forceManyBody()` — projects repel each other (strength -600), `d3.forceCenter()` — centers the simulation on WORLD_WIDTH/2, WORLD_HEIGHT/2
- Run simulation for 300 ticks, then freeze (alpha = 0). No live simulation during interaction.
- Store final node positions in state. Re-simulate only when `data.projects` length or `data.tasks` length changes.

**Heat indicators:**
- Overdue tasks: red outer ring stroke (#f87171), glow filter `drop-shadow(0 0 8px rgba(248,113,113,0.6))`
- Stale items (no update in 7+ days): opacity 0.45
- Recent items (updated in last 24h): pulsing glow via CSS animation `@keyframes pulse-glow`

**Hover behavior:**
- On node hover: linked nodes (same project, blocking relationships) highlight. Unlinked nodes dim to opacity 0.2. 150ms transition.

**Minimap:**
- SVG in bottom-right corner, 224×140px
- Shows project circles only (color-coded)
- Shows viewport rectangle (white stroke)
- Click on minimap: `setPan` to center on clicked world coordinate

**Filter toolbar (bottom center, inline with dock):**
- [Tasks] [Ideas] — toggle visibility, styled with amber border when active
- [Reset zoom] — returns to Level 1

**Idea-to-project mapping (fix from V4 analysis):**
- Ideas do NOT use `index % data.projects.length` — that was wrong
- Instead: if `idea.project_id` exists, attach to that project's cluster
- If no `idea.project_id`, float unattached ideas in the center of the canvas (WORLD_WIDTH/2, WORLD_HEIGHT/2) with gentle random offset
- Add `project_id: string | null` to idea nodes in variantData

---

## Shared Chrome — Always Present

### Status Bar (bottom, always)

```
Active {N} | Blocked {N} | Urgent {N} | Ideas {N} | Unread {N}      {HH:MM}
```

- JetBrains Mono, 10px, uppercase, tracked
- Live clock: `useEffect` with `setInterval(60000)` — never frozen
- Updates reactively as workspace data changes
- In FOCUS mode: warm charcoal text on parchment
- In ORBIT mode: gray text on #111111

### Floating Dock (bottom center, above status bar)

```
[  FOCUS  ]  [  ORBIT  ]  [  ⌘K  ]
```

- Pill shape, `backdrop-blur`, semi-transparent dark bg
- Active mode button: amber text, no fill (not filled amber — Ive rule)
- Inactive mode button: opacity-60
- `⌘K` button: always present, opens command palette
- Tab key cycles between FOCUS and ORBIT

### Command Palette (`Cmd+K`)

From V1's `CommandPalette.tsx` — shared component, used in both modes.

Commands available in both modes:
- Jump to section (FOCUS only): Morning Brief, Focus Queue, Timer
- Switch mode: "Focus mode" / "Orbit mode"
- Create task (inline prompt, not `window.prompt` — see below)
- Create idea
- Create project
- Search: all tasks, projects, ideas, articles — fuzzy match
- Task quick-actions: "Start [task title]", "Mark [task title] done"
- "Share daily digest" — copies markdown summary to clipboard

**Replace all `window.prompt` calls with an inline input overlay:**
A small floating input appears in the center of the screen, styled with the current mode's palette. Press Enter to confirm, Escape to cancel. Never use `window.prompt` — it breaks modal context and looks terrible.

---

## Framer Motion — Required

Install:
```bash
npm install framer-motion
```

Use for:
1. **Mode switch transition** — FOCUS ↔ ORBIT: `AnimatePresence` with slide-up/slide-down variants. FOCUS slides down when ORBIT appears. ORBIT slides up into view. 300ms ease-out.
2. **Task promotion in FOCUS** — when a "Next up" task becomes primary: layout animation (`layout` prop on task title). The title moves from the next-up panel to the primary position. 250ms.
3. **ORBIT task detail card** — slides up from canvas bottom. 300ms ease-out.
4. **Morning Brief collapse** — height animation from full to slim bar. 350ms ease-in-out.
5. **Card-level enter animation** — new tasks appearing in Next up: fade-in + slight Y translate. 200ms.

Do NOT use CSS `@keyframes fadeIn` without defining it in Tailwind config. Use Framer Motion for all animation. It's installed, use it.

---

## Features Inventory — What Comes From Where

| Feature | From | Implementation |
|---|---|---|
| MorningBrief hero with collapsible | V1 | `MorningBrief.tsx` (existing shared component) — wrap in framer-motion height animation |
| Momentum Score on morning brief | V5 | `MomentumScore.tsx` (existing shared component) |
| Command Palette | V1/V2 | `CommandPalette.tsx` (existing) — add inline input overlay, remove window.prompt |
| Primary task display (Newsreader large) | V3/V5 | New `PrimaryTaskView.tsx` component |
| Focus timer with spacebar | V3 | Extract from `StudioDashboard.tsx` into `FocusTimer.tsx` shared component |
| Smart mode suggestion | V3 | Extract `decideSuggestedMode()` — show as dock prompt, not separate button |
| Contextual reading panel | V3 | Extract from `StudioDashboard.tsx` into `ContextPanel.tsx` |
| Live status bar (with live clock) | V2 | New `StatusBar.tsx` — fix the frozen clock with setInterval |
| Keyboard shortcuts (j/k/Enter/Escape/?) | V2 | New `useKeyboardNav` hook |
| Sparkline charts | V2/V4 | `SparklineChart.tsx` (existing shared component) |
| Spatial canvas with pan/zoom | V4 | Extract canvas from `MapDashboard.tsx`, rebuild with three zoom levels |
| d3-force node layout | V4 (planned, not built) | New `useForceLayout` hook |
| Minimap | V4 | Extract from `MapDashboard.tsx` |
| Dependency edges | V4 | Extract from `MapDashboard.tsx` |
| Heat indicators | V4 | Extract predicates from `variantData.ts` |
| Three zoom levels | V4 (not built — build now) | New zoom level logic in canvas component |
| Adaptive card ordering algorithm | V5 | Extract `buildCards()` from `PulseDashboard.tsx` — use to determine task display order in FOCUS |
| Progress dots | V5 | Repurpose as "task queue depth indicator" in FOCUS mode right edge |
| Daily digest export | V5 | Extract from `PulseDashboard.tsx`, add to command palette |
| Inline task create (no window.prompt) | New | `InlineInputOverlay.tsx` — used everywhere |
| Framer Motion transitions | All (fixed) | AnimatePresence for mode switches, layout animation for task promotion |

---

## New Dependencies

```bash
npm install framer-motion d3-force @types/d3-force
```

Framer-motion may already be installed — check `package.json`. If yes, skip.

---

## File Structure

```
components/variants/v6/
  CommandDashboard.tsx          # Root component — mode router
  focus/
    FocusMode.tsx               # FOCUS mode layout
    PrimaryTaskView.tsx         # Hero task display
    ContextPanel.tsx            # Next up + related reading
    FocusTimer.tsx              # Pomodoro timer (extracted from V3)
    MorningBriefHero.tsx        # Collapsible brief (wraps existing MorningBrief)
  orbit/
    OrbitMode.tsx               # ORBIT mode layout
    SpatialCanvas.tsx           # SVG + React node overlay + pan/zoom
    NodeLayer.tsx               # All node rendering (project/task/idea)
    EdgeLayer.tsx               # SVG edge rendering (blocking/related lines)
    ZoomLevelManager.tsx        # Determines zoom level, renders appropriate detail
    TaskDetailCard.tsx          # Framer-motion slide-up card for zoom level 3
    Minimap.tsx                 # Mini SVG overview (extracted from V4)
    useForceLayout.ts           # d3-force simulation hook
  shared/
    StatusBar.tsx               # Always-visible bottom bar with live clock
    FloatingDock.tsx            # [FOCUS] [ORBIT] [⌘K] pill
    InlineInputOverlay.tsx      # Replaces all window.prompt usage
    useKeyboardNav.ts           # j/k/Enter/Escape/? keyboard handling
```

Shared components already in `components/variants/shared/`:
- `CommandPalette.tsx` — reuse as-is (add inline input creation actions)
- `MorningBrief.tsx` — reuse as-is
- `MomentumScore.tsx` — reuse as-is
- `SparklineChart.tsx` — reuse as-is
- `variantData.ts` — add `buildCards()` export (currently in V5), fix idea-to-project mapping

---

## Architecture — `CommandDashboard.tsx` Root

```tsx
export function CommandDashboard() {
  const [mode, setMode] = useState<'focus' | 'orbit'>(getInitialMode())
  const [paletteOpen, setPaletteOpen] = useState(false)

  // keyboard: Tab = toggle mode, Cmd+K = palette
  useEffect(() => { /* Tab and Cmd+K handlers */ }, [])

  return (
    <div className={`h-screen overflow-hidden ${modeBackground[mode]}`}>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <AnimatePresence mode="wait">
        {mode === 'focus' ? (
          <motion.div key="focus" /* slide-down exit, slide-up enter */>
            <FocusMode onSwitchMode={() => setMode('orbit')} />
          </motion.div>
        ) : (
          <motion.div key="orbit" /* slide-up enter */>
            <OrbitMode onSwitchMode={() => setMode('focus')} />
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBar />
      <FloatingDock mode={mode} onModeChange={setMode} onPaletteOpen={() => setPaletteOpen(true)} />
    </div>
  )
}

function getInitialMode(): 'focus' | 'orbit' {
  const hour = new Date().getHours()
  return hour >= 18 ? 'orbit' : 'focus' // evening → orbit for review
}
```

---

## Implementation Phases

### Phase 1 — Shell and Shared Infrastructure
- Create `components/variants/v6/` directory structure
- Add `v6` to `VariantDashboardRoot.tsx`
- Add `npm run dev:v6` script pointing to port 3107
- Install framer-motion, d3-force
- Build `StatusBar.tsx` with live clock
- Build `FloatingDock.tsx`
- Build `InlineInputOverlay.tsx` (replaces window.prompt everywhere in V6)
- Build `useKeyboardNav.ts` hook
- Add font imports (Newsreader, Fraunces, JetBrains Mono) to layout

### Phase 2 — FOCUS Mode
- Build `FocusMode.tsx` layout shell
- Build `PrimaryTaskView.tsx` — Newsreader title, context chips, action buttons
- Build `FocusTimer.tsx` — extract from StudioDashboard, add spacebar control
- Build `MorningBriefHero.tsx` — wrap existing MorningBrief, add framer-motion collapse
- Build `ContextPanel.tsx` — Next up + related reading
- Wire adaptive ordering from V5's `buildCards()` logic to determine which task appears first
- Add keyboard shortcuts: space (timer), d (done), b (blocked), j (next task), Cmd+K
- Verify momentum score appears in morning brief

### Phase 3 — ORBIT Mode (Portfolio + Cluster zoom levels)
- Build `SpatialCanvas.tsx` with pan/zoom using existing V4 logic as base
- Build `useForceLayout.ts` hook with d3-force simulation
- Build `EdgeLayer.tsx` for blocking (red) and related (white) edges
- Build `NodeLayer.tsx` with project circles, task nodes, idea dots
- Implement zoom level switching: `zoom < 0.65` → Level 1, `0.65–1.3` → Level 2
- Build `Minimap.tsx` (reuse V4 logic)
- Add heat indicators: overdue glow, stale fade, recent pulse animation
- Add hover-to-dim behavior for unlinked nodes
- Add filter toggles (Tasks, Ideas) in toolbar row
- Fix idea-to-project mapping (use project_id, not index modulo)

### Phase 4 — Task Detail Card (Zoom Level 3)
- Build `TaskDetailCard.tsx` — framer-motion slide-up, Newsreader title, action buttons
- Implement auto-select on deep zoom: when `zoom >= 1.3` and user is hovering a task node, auto-select it
- Implement task detail card showing over dimmed canvas
- Wire [Start] [Done] [Block] to workspace actions
- Add "Related tasks" strip at card bottom (same-project tasks)
- Escape to close card + zoom back to Level 2

### Phase 5 — Mode Transitions and Polish
- Implement AnimatePresence mode switch (FOCUS slide-down → ORBIT slide-up)
- Implement task promotion layout animation in FOCUS (framer-motion `layout` prop)
- Add smart mode suggestion to dock (subtle amber text prompt, not a button)
- Add daily digest export to command palette
- Shortcut overlay (`?` key)
- Final color audit: amber appears ONLY on interactive elements

---

## Checklist Before Shipping

- [ ] Clock in status bar updates live (setInterval, not static `new Date()`)
- [ ] No `window.prompt` calls anywhere in V6 (use InlineInputOverlay)
- [ ] Font variables applied — Newsreader on hero titles, Fraunces on section labels, JetBrains Mono on numbers
- [ ] Three zoom levels render distinctly different content (not just bigger/smaller same content)
- [ ] d3-force layout is used (not static circular math)
- [ ] framer-motion AnimatePresence on mode switch (not CSS keyframe)
- [ ] Task promotion in FOCUS is a layout animation (title moves, not jump-cuts)
- [ ] Focus timer responds to spacebar
- [ ] Idea nodes attached to correct project (not index modulo)
- [ ] Dependency edges appear correctly: blocking = red, related = semi-transparent white
- [ ] Heat indicators: overdue nodes glow red, stale nodes fade, recent nodes pulse
- [ ] Minimap click-to-navigate works
- [ ] Status bar shows live counts that update as user takes actions
- [ ] Amber used ONLY for interactive elements — do a color audit

---

## What V6 Is Not

Do not add:
- Page-based navigation (no `/kanban`, `/projects`, `/ideas` routes needed)
- Sidebar of any kind
- Any modal dialogs that require clicking outside to close (use InlineInputOverlay or framer-motion sheets)
- A third mode (FOCUS and ORBIT are sufficient — Voldemort's verdict)
- Color-coded status beyond amber accent + heat indicators — monochrome is confident
- Any feature that requires a user to understand how the feature works before using it

---

## Port Reference

All variants for context during development:
- Legacy: `http://127.0.0.1:3000`
- In-between: `http://127.0.0.1:3106`
- V1 The Brief: `http://127.0.0.1:3101`
- V2 The Cockpit: `http://127.0.0.1:3102`
- V3 The Studio: `http://127.0.0.1:3103`
- V4 The Map: `http://127.0.0.1:3104`
- V5 The Pulse: `http://127.0.0.1:3105`
- **V6 The Command: `http://127.0.0.1:3107`**
