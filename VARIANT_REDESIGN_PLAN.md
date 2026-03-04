# Co-Working Dashboard - 5 Radical Redesigns
## Musk x Ive Creative Brief for Codex Execution

**Date:** 2026-02-20
**Context:** The current 5 "variants" are cosmetic skins of the same dashboard. Same sidebar-left layout, same 6 pages, same components, same interactions. Different colors and copy. This plan delivers 5 genuinely different products that escalate in creative ambition.

**Shared constraints:**
- Same Next.js codebase, same variant system architecture (`NEXT_PUBLIC_DASHBOARD_VARIANT`)
- Same underlying data model (`WorkspaceData` from `lib/workspace.ts`)
- Local-first, dummy data, no backend changes needed
- Each variant runs on its own port (3101-3105)
- Must be functional - not mockups. Real interactions with real data.

**What changes per variant:** Layout structure, navigation paradigm, page composition, new components, new features, typography system, interaction patterns, information hierarchy.

**Color philosophy (Ive directive):** No default SaaS rainbow. Each variant earns its palette from its concept. If color serves recognition, use it boldly. If it doesn't, restrain it. Monochrome is not boring - it's confident. Colorful is not messy - if every color has a job. Let the interaction model dictate the palette, not convention.

---

## V1 - "The Brief" (Port 3101)
### Concept: Kill the 6-page structure. One page. One scroll. Everything you need in 30 seconds.

**Musk rationale:** Why do I click 6 tabs to understand my day? That's 6 page loads to answer one question: "What should I do right now?" Collapse it.

**Ive rationale:** A newspaper front page. Above the fold is what matters. Below is context. No navigation required - the content IS the navigation.

### Layout
- **NO sidebar.** Navigation is a slim horizontal bar at the top with section anchors (not page links).
- **Top bar:** Date + "The Brief" wordmark left. Command palette trigger (Cmd+K icon) right. Variant pill.
- **Single scrollable page** with distinct sections separated by generous whitespace.
- Sections: Morning Brief > Focus Queue > Active Projects > Ideas Pipeline > Reading Stack > Activity Stream
- Each section has a "quick action" inline - add task, advance idea, mark article read - without navigating away.

### New Features
1. **Morning Brief card** (top of page): AI-generated 3-sentence summary. "You have 2 urgent tasks, 1 blocker on Offer & Pricing, and 3 unread articles. Your highest-leverage move is finishing the responsive shell. Yesterday you completed 1 task and promoted 1 idea." Built from workspace data, no API needed.
2. **Command Palette** (Cmd+K): Fuzzy search across all tasks, projects, ideas, articles. Quick actions: create task, create idea, jump to section. This replaces traditional navigation entirely.
3. **Inline quick-create:** Each section has a single-line input that creates the entity without opening a form. Type and press Enter.

### Typography & Style
- Font: Inter for body, Fraunces for section headings (editorial feel)
- Color: **Monochrome with warmth.** Off-white stock (#FAFAF8), near-black text (#1a1a1a), one single accent: warm charcoal (#2C2C2C) for interactive elements. No blue, no orange, no color coding. Priority is communicated through weight and position, not color. The only color in the entire UI: project dots (inherited from data). This is a newspaper - ink on paper.
- Cards: No borders. Use whitespace and subtle shadows only. Paper-like.
- Sections divided by thin horizontal rules, not cards-inside-cards.

### Specific Section Designs

**Morning Brief (hero area):**
- Full-width, slightly warm background
- Large display type: "Thursday, Feb 20"
- Three stat pills inline: "2 urgent" / "1 blocked" / "3 unread"
- One sentence AI summary below
- Single CTA button: "Start with [most urgent task title]"

**Focus Queue:**
- Horizontal scrolling cards (not vertical list)
- Each card: priority color bar on left edge, title, project tag, due date
- Click card to expand inline with description + status change buttons
- Max 5 cards visible. If more, "+N more" indicator.

**Active Projects:**
- Two-column grid of project cards
- Each card: project name, colored dot, completion ring (circular progress), task counts
- Click to expand inline showing project's tasks

**Ideas Pipeline:**
- Horizontal swim lanes: Brainstorm > Research > In Progress > Shipped
- Cards are minimal: title + category tag only
- Drag to advance (same as current kanban but horizontal for ideas)

**Reading Stack:**
- Simple list. Title + source domain + status badge
- One-click status toggle buttons (unread > reading > read > archive)
- Grouped by reading list with collapsible headers

**Activity Stream:**
- Timeline on left edge (vertical line with dots)
- Each entry: timestamp, action badge, message
- Compact - show 10 most recent, "Show all" expands

---

## V2 - "The Cockpit" (Port 3102)
### Concept: Three-panel persistent layout. See everything at once without scrolling. Information density over whitespace.

**Musk rationale:** SpaceX mission control shows 40 data points on one screen. A solopreneur dashboard should show all active state in one viewport - no scrolling, no clicking, no hunting.

**Ive rationale:** Think Bloomberg Terminal meets the original iPod click wheel. Dense but not chaotic. Every element has a clear hierarchy. Grid precision.

### Layout
- **NO sidebar. NO traditional pages.**
- **Fixed viewport layout** - designed to fill exactly one screen (100vh). No scroll on the main view.
- Three persistent panels in a grid:

```
+---------------------------+-------------------+
|                           |                   |
|     LEFT PANEL (55%)      |  RIGHT TOP (45%)  |
|     Active Work           |  Projects + Stats |
|                           |                   |
+---------------------------+-------------------+
|     BOTTOM LEFT (55%)     |  RIGHT BOT (45%)  |
|     Pipeline              |  Feed             |
+---------------------------+-------------------+
```

- **Floating top bar:** Minimal - clock, date, variant name, notification count, settings gear.
- Panels are resizable via drag handles.

### New Features
1. **Live Status Bar** (bottom of viewport, always visible): Shows real-time counts. "5 active | 1 blocked | 2 urgent | 3 ideas open | 2 unread". Updates as you interact. Like a code editor's status bar.
2. **Panel Switching:** Each panel has tabs at its top to switch content. Left panel can show Kanban OR Focus Queue. Right top can show Projects OR Reading. This means all 6 "pages" are accessible as panel content without navigation.
3. **Keyboard-first navigation:** j/k to move between items, Enter to expand, Escape to collapse, 1-4 to focus panels, / to search. Keyboard shortcuts overlay (press ?).
4. **Sparkline charts** on project cards: Tiny inline charts showing task completion velocity over last 7 days. Built from activity data timestamps.

### Typography & Style
- Font: JetBrains Mono for data/numbers, Space Grotesk for headings, system sans for body
- Color: **Monochrome dark.** Background #0C0C0C, panels #141414, borders #222222, text #E0E0E0. Accent: amber (#F5A623) - used ONLY for interactive/actionable elements (buttons, focused panel border, active tab underline). Everything else is grayscale. The amber stands out precisely because the rest is colorless. Data sparklines use a single white-to-amber gradient. Blocked items use amber at 40% opacity, not red. This is a control room - disciplined, not decorative.
- Data-forward: Numbers are large, labels are small
- No border-radius above 4px. Sharp, precise, technical.
- Panels have 1px borders, subtle amber inner glow on focus

### Specific Panel Designs

**Left Panel - Active Work (default: Kanban):**
- Compact kanban columns (Backlog/Todo/In Progress/Blocked/Done)
- Tasks are single-line entries: priority dot + title + due indicator
- Click task to expand to 2-line (adds description + project)
- Tab options: [Kanban] [Focus List] [Timeline]

**Right Top - Projects + Stats:**
- Project list with inline sparklines
- Completion bars are thin horizontal (not circular)
- Metrics row: velocity, blocked count, overdue count
- Tab options: [Projects] [Reading Lists] [Metrics]

**Bottom Left - Pipeline:**
- Ideas in a compact table view: Title | Category | Status | Owner | Updated
- Sortable by clicking column headers
- Inline status change via dropdown in the Status column
- Tab options: [Ideas] [Backlog] [Archive]

**Right Bottom - Feed:**
- Activity stream, ultra-compact
- Each line: timestamp (HH:MM) + icon + message - one line per entry
- Auto-scrolls to latest
- Tab options: [Activity] [Notifications] [Search Results]

---

## V3 - "The Studio" (Port 3103)
### Concept: Mode-based interface. Not "6 pages of content" but "3 modes of working": Plan, Execute, Review. The UI transforms based on what mode you're in.

**Musk rationale:** You don't need all information all the time. When you're planning, you need projects and ideas. When you're executing, you need the current task and nothing else. When you're reviewing, you need activity and metrics. Stop showing everything at once.

**Ive rationale:** The iPhone doesn't show you the phone, mail, and camera simultaneously. You're in one context. Full attention. The transitions between modes should feel physical - like rotating a cube.

### Layout
- **Floating mode switcher** at bottom center of screen (like a dock): three buttons - Plan / Execute / Review
- Current mode fills the entire viewport
- **Smooth transitions** between modes (slide left/right animation, 300ms)
- **Minimal chrome:** No header. Mode name appears as large watermark text in the background. Date and quick-create float in top-right corner.

### Mode: PLAN
```
+------------------------------------------+
|  PLAN                                     |
|                                           |
|  +--Projects Grid--+  +--Ideas Board---+ |
|  |                  |  |                | |
|  |  (full project   |  | (kanban-style  | |
|  |   cards with     |  |  idea columns) | |
|  |   task lists     |  |                | |
|  |   expanded)      |  |                | |
|  +------------------+  +----------------+ |
|                                           |
|  [Reading Queue - collapsible strip]      |
+------------------------------------------+
```

### Mode: EXECUTE
```
+------------------------------------------+
|                                           |
|                                           |
|         Current Task                      |
|         ============                      |
|         "Ship responsive shell"           |
|                                           |
|         Project: Co-Working Dashboard     |
|         Priority: URGENT                  |
|         Due: Tomorrow                     |
|                                           |
|         [Mark Done]  [I'm Blocked]        |
|                                           |
|   +-Next Up------+  +-Context-----------+|
|   | Enable local | | Recent activity    ||
|   | Draft review | | related to this    ||
|   +--------------+ | task/project       ||
|                     +--------------------+|
+------------------------------------------+
```

### Mode: REVIEW
```
+------------------------------------------+
|  REVIEW                                   |
|                                           |
|  +--Metrics Row (full width)------------+|
|  | Active | Done | Blocked | Velocity    ||
|  +--------------------------------------+|
|                                           |
|  +--Activity Timeline---+  +--Summary--+ |
|  |  (full activity log  |  | Weekly    | |
|  |   with filters)      |  | Report    | |
|  |                      |  | Card      | |
|  +----------------------+  +-----------+ |
+------------------------------------------+
```

### New Features
1. **Focus Mode (in Execute):** One task fills the screen. Timer running. No distractions. Just the task, its context, and action buttons. Like a full-screen text editor.
2. **Weekly Report Card (in Review):** Auto-generated summary card: tasks completed, ideas advanced, articles read, projects progressed. Compares this week vs last (from activity timestamps).
3. **Smart mode suggestion:** When you open the dashboard, it suggests a mode based on time of day. Morning = Plan, Midday = Execute, Evening = Review. Displayed as a gentle prompt, not forced.
4. **Contextual reading:** In Execute mode, reading list items tagged to the current task's project appear in the Context panel. Reading becomes relevant to what you're doing right now.

### Typography & Style
- Font: Instrument Serif for mode names (large, editorial), Inter for content, Berkeley Mono for data
- Color: **Three temperatures, not three colors.** The base is warm linen (#F5F0E8). Each mode shifts the temperature:
  - Plan: Cooler - the linen shifts slightly blue-gray. Text and accents in cool slate (#3F4F5F). Cerebral, calm.
  - Execute: Warmer - the linen shifts slightly toward parchment. Text and accents in deep warm black (#2A1F1A). Focused, urgent.
  - Review: Neutral - pure linen. Text in balanced charcoal (#333333). Reflective, even.
  - The shift is subtle - like walking between rooms with different lighting. Same palette family, different mood. NOT three unrelated colors. One accent per mode for interactive elements only.
- Cards use left-edge thickness (not color) to signal mode: thin in Plan, medium in Execute, thick in Review.
- Generous whitespace. Content breathes.
- Transitions: Slide + fade between modes, 280ms ease-out. Background temperature shift transitions over 400ms.

---

## V4 - "The Map" (Port 3104)
### Concept: Spatial interface. Everything is a node on a canvas. Connections between entities are visible. Zoom to navigate.

**Musk rationale:** A dependency is invisible in a list. You only see it when something breaks. Make every relationship between tasks, projects, and ideas visible by default. Show the system, not just the parts.

**Ive rationale:** Think of the iOS home screen before and after widgets. A flat list of apps vs a living, spatial arrangement that communicates priority through size and position. The map is the interface.

### Layout
- **Full-screen canvas** with pan (drag) and zoom (scroll/pinch)
- **No sidebar, no header, no pages**
- **Floating toolbar** (bottom center): Zoom controls, filter toggles, quick-create button, search
- **Floating minimap** (bottom-right corner): Shows your current viewport position on the full canvas

### Canvas Structure
- **Three zoom levels** with different content density:
  - **Zoomed out (Portfolio):** Projects appear as large circles. Size = task count. Color = project color. Lines connect projects that share dependencies (tasks in one project blocked by tasks in another). Ideas float as smaller dots around related projects.
  - **Zoomed mid (Project):** One project's tasks appear as a cluster. Kanban columns are spatial regions (left=backlog, right=done). Lines show task dependencies. Reading items attached to this project float nearby.
  - **Zoomed in (Task):** Single task card fills view. Full detail: title, description, project, priority, due date, related activity. Action buttons. Related tasks shown as connected satellites.

### New Features
1. **Dependency lines:** Visual connections between tasks that reference each other (inferred from shared project + "blocked" status, or explicit future linking). Red lines = blocking relationship. Gray lines = same project.
2. **Heat indicators:** Overdue tasks glow red. Stale items (no update in 7+ days) fade to gray. Recently active items pulse subtly.
3. **Cluster auto-layout:** Projects automatically arrange on the canvas using a force-directed layout (d3-force). Related projects cluster together. Disconnected items drift to edges.
4. **Quick-create anywhere:** Double-click empty canvas to create a task/idea at that position. It auto-attaches to the nearest project cluster.
5. **Minimap navigation:** Tiny overview in corner. Click to jump to any area of the canvas.

### Typography & Style
- Font: Space Mono for labels, Space Grotesk for card content
- Color: **Color earns its place here - this is the one variant where it's functional.** Deep charcoal canvas (#1C1C1E). Nodes use project colors (already defined in workspace data) - this is the one context where multi-color is justified because color IS the clustering signal. You instantly see "all the orange nodes are Co-Working Dashboard, all the teal nodes are Offer & Pricing." Lines are semi-transparent white (#ffffff20). The canvas itself is austere - all visual energy goes to the nodes. No UI chrome gets color. Toolbars and overlays are pure grayscale glass.
- Nodes have soft glows matching their project color (12px blur, 30% opacity)
- When hovering a node, connected nodes highlight and unrelated ones dim to 20% opacity
- Transitions: Smooth zoom (d3-zoom or framer-motion), 200ms easing

### Technical Notes for Codex
- Use HTML5 Canvas or SVG for the map layer (SVG recommended for interactivity)
- d3-force for layout positioning
- Framer Motion for zoom transitions
- Overlay React components for node detail cards (positioned absolutely over the canvas)
- Store canvas viewport state (pan x/y, zoom level) in React state

---

## V5 - "The Pulse" (Port 3105)
### Concept: The anti-dashboard. No chrome. No grid. No sidebar. One thing at a time, full screen, swipe to dismiss. Your day as a curated editorial feed.

**Musk rationale:** What if the dashboard was more like a TikTok feed for your work? Each card is full-screen. You swipe through your priorities. No cognitive overhead of choosing what to look at. The system decides the order based on urgency and freshness. You just react.

**Ive rationale:** Apple's original iPhone philosophy: one app at a time, full attention. The home screen is not the experience - the experience is whatever you're looking at right now. Remove all the scaffolding. The content is the interface.

### Layout
- **Full-screen card stack.** Each card takes 100% of the viewport.
- **Swipe up / down** (or arrow keys / j/k) to move between cards.
- **No navigation, no sidebar, no header, no tabs.**
- **Small floating indicators:** Card position dot indicators on the right edge (like iOS page dots). Subtle category label in top-left corner.
- **Pull-up drawer** from bottom edge: Quick-create and search. Only appears when you need it.

### Card Stack Order (algorithmically sorted)
1. **Morning Pulse card** (always first): Your 3 key numbers + AI summary
2. **Urgent tasks** (1 card each): Full-screen task detail with action buttons
3. **Blocked items** (1 card each): What's stuck and why
4. **Top idea** (if any in "in_progress"): Current idea with advance button
5. **Unread articles** (batched as 1 card): Reading list summary
6. **Project health cards** (1 per active project): Progress + sparkline
7. **Activity summary** (last card): What happened since yesterday
8. **"You're caught up" card** (final): Motivational close + "Create something new" CTA

### New Features
1. **Momentum Score:** Single number (0-100) calculated from: tasks completed this week / tasks created, ideas advanced, blocked items resolved, reading done. Shown prominently on the Pulse card. Trend arrow (up/down vs yesterday).
2. **Gesture navigation:** Swipe up = next card, swipe down = previous, swipe right = "done/dismiss", swipe left = "snooze/skip". On desktop: arrow keys + keyboard shortcuts.
3. **Adaptive card ordering:** Cards are sorted by a priority score: urgent > blocked > due soon > recently updated > stale. The system decides what you see first. No manual navigation needed.
4. **Card actions:** Each card type has contextual actions. Task card: [Start] [Done] [Block] [Skip]. Idea card: [Advance] [Kill] [Note]. Article card: [Read Now] [Mark Read] [Archive].
5. **Progress dots:** Right edge shows your progress through the stack. Dot colors: red (needs action), green (informational), gray (dismissed). You can see at a glance how many items need you.
6. **Daily digest export:** "Share your Pulse" button on the summary card - copies a markdown summary to clipboard for standup notes or team updates.

### Typography & Style
- Font: Newsreader for card titles (large, 32-40px, serif, editorial). Inter for body text. Monospace for numbers/stats.
- Color: **This is the colorful variant - and it earns it.** In a swipe interface with no navigation chrome, color is the ONLY way to instantly know what kind of card you're looking at. It replaces navigation labels entirely. The palette is considered - not random SaaS colors:
  - Pulse card: Deep ink (#0C1222) with cream text - this is the "cover page," premium and grounding
  - Task cards: Warm stock (#FFF8F0) with rich black text - clean, workable, paper-like
  - Blocked cards: Dusty rose (#F5E6E0) with dark rose accent (#8B3A3A) - not alarm-red, more "attention needed"
  - Idea cards: Soft lavender (#EEEAF5) with deep violet text (#3B2D63) - creative, lighter
  - Reading card: Pale sage (#EDF2ED) with forest text (#2D4A2D) - calm, input mode
  - Project cards: Warm sand (#F0EBE0) with dark umber text (#3D3328) - grounded, structural
  - Activity card: Cool gray (#F0F1F3) with slate text - neutral, retrospective
  - "Caught up" card: Pure black (#000000) with white text - full stop, you're done
  - The colors form a cohesive warm-neutral family, not a rainbow. Think paint swatches from the same collection, not 8 random brand colors.
- No borders. Color IS the container.
- Cards transition with a vertical slide + fade (300ms)
- Typography is hero-sized. Task titles at 28-36px. Numbers at 48-64px. This is magazine layout, not SaaS layout.

### Technical Notes for Codex
- Use Framer Motion for card stack transitions (AnimatePresence with slide variants)
- Touch events: use @use-gesture/react for swipe detection
- Card ordering logic: Pure function that takes WorkspaceData and returns sorted Card[] with type discriminators
- Each card is a full React component receiving typed props
- Dot indicator component positioned fixed on right edge
- Pull-up drawer: Framer Motion drag constraint + sheet pattern

---

## Implementation Architecture (Shared)

### How variants coexist in one codebase

The current variant system uses `NEXT_PUBLIC_DASHBOARD_VARIANT` and a theme/journey config. The new variants need more than config swaps - they need different **page components** per variant.

**Proposed approach:**

1. **Keep the current `(dashboard)/layout.tsx` as a variant router.**
   - Read the variant and render a completely different shell per variant.
   - V1-V2: Custom layout components (no sidebar, different nav)
   - V3: Mode-based layout with mode state
   - V4: Canvas layout (no traditional shell)
   - V5: Card stack layout (no shell at all)

2. **Create variant-specific page directories:**
   ```
   components/variants/v1/  - Brief components
   components/variants/v2/  - Cockpit panels
   components/variants/v3/  - Mode screens (Plan, Execute, Review)
   components/variants/v4/  - Canvas nodes and map
   components/variants/v5/  - Card stack and card types
   ```

3. **Shared data layer unchanged:** `WorkspaceProvider` and `lib/workspace.ts` stay identical. All variants consume the same `useWorkspace()` hook.

4. **New shared components:**
   - `CommandPalette.tsx` (V1, V2 use it)
   - `MorningBrief.tsx` (V1, V5 use it)
   - `SparklineChart.tsx` (V2, V4 use it)
   - `MomentumScore.tsx` (V5 uses it, could be shared)

5. **New dependencies to install:**
   - `framer-motion` (V3 transitions, V4 zoom, V5 card stack)
   - `d3-force` + `d3-zoom` (V4 canvas layout)
   - `@use-gesture/react` (V5 swipe)
   - `cmdk` (V1, V2 command palette)
   - `fuse.js` (fuzzy search for command palette)

### Route strategy

Since V1 has no pages (single scroll), V3 has modes (not routes), V4 has a canvas, and V5 has a card stack:

- V1: Only `/` renders. Anchors for sections, no route changes.
- V2: Only `/` renders. Panel content switches via local state, not routes.
- V3: `/plan`, `/execute`, `/review` routes (or local state with URL sync).
- V4: Only `/` renders. Canvas state in URL hash for shareability.
- V5: Only `/` renders. Card position in local state.

The existing routes (`/overview`, `/kanban`, etc.) can remain as fallbacks or be conditionally disabled per variant.

---

## Execution Order for Codex

**Phase 1: Scaffolding**
- Modify `(dashboard)/layout.tsx` to branch on variant
- Create the 5 variant directories under `components/variants/`
- Install new dependencies
- Create shared components (CommandPalette, MorningBrief, SparklineChart, MomentumScore)

**Phase 2: V1 - The Brief** (least structural change, validates the approach)
- Build single-page layout with horizontal top nav
- Build section components (FocusQueue, ProjectGrid, IdeasLanes, ReadingStack, ActivityTimeline)
- Integrate CommandPalette
- Build MorningBrief generator

**Phase 3: V2 - The Cockpit**
- Build 4-panel grid layout with resize handles
- Build panel content components (compact kanban, project list with sparklines, ideas table, activity feed)
- Add keyboard navigation system
- Add live status bar

**Phase 4: V3 - The Studio**
- Build mode switcher dock
- Build Plan screen (projects + ideas side by side + reading strip)
- Build Execute screen (focus mode with single task + context)
- Build Review screen (metrics + activity + weekly report)
- Add mode transitions
- Add smart mode suggestion

**Phase 5: V4 - The Map**
- Build SVG canvas with d3-force layout
- Build node types (project circle, task node, idea dot)
- Build dependency line rendering
- Build zoom levels with content density switching
- Build minimap
- Build node detail overlay

**Phase 6: V5 - The Pulse**
- Build card stack with swipe navigation
- Build card types (PulseCard, TaskCard, BlockedCard, IdeaCard, ReadingCard, ProjectCard, ActivityCard, CaughtUpCard)
- Build momentum score calculator
- Build progress dot indicator
- Build pull-up drawer for create/search
- Build card ordering algorithm

---

## Summary: The Creative Escalation

| Variant | Innovation Level | Nav Paradigm | Key Invention |
|---|---|---|---|
| V1 The Brief | Conservative | Top bar + Cmd+K | Single-page daily newspaper |
| V2 The Cockpit | Moderate | Panels + keyboard | Bloomberg-style 4-panel density |
| V3 The Studio | Bold | Mode dock | Plan/Execute/Review work modes |
| V4 The Map | Very bold | Canvas + zoom | Spatial dependency visualization |
| V5 The Pulse | Maximum | No nav - swipe | Full-screen card feed like TikTok for work |
