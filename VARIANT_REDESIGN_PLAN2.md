Jony Ive + Elon Musk: Build vs. Brief                                                                                                                                                                     
                                                                                                                                                                                                            
  ---                                                                                                                                                                                                       
  V1 - The Brief                                                                                                                                                                                          

  What works: Core structure is solid. Horizontal scroll cards, command palette, MorningBrief hero, inline quick-create. The monochrome palette with warmth is correctly implemented.

  Ive:

  The editorial promise breaks in two places. Ideas Pipeline is rendered as a vertical 4-column grid - the spec said horizontal swim lanes, left-to-right flow like reading direction. Brainstorm → Shipped
  should feel like progression across space, not items stacked in columns. The motion is wrong. Second: section headings use a generic font-serif. The spec called for Fraunces - a specific typeface with
  slab-serif character that creates the newspaper feel. Without it, the editorial identity is flat.

  Musk:

  Activity Stream shows 10 items. Done. No "Show all" - it just ends. That's a dead end where the spec said expansion. Minor but the cut feels lazy.

  Actions

  1. Ideas Pipeline - change to horizontal swimlane layout. Replace grid gap-3 lg:grid-cols-4 with a flex gap-4 overflow-x-auto row. Each lane is a vertical flex column with fixed min-width (~220px). The
  "Advance" button still works, just repositioned. (BriefDashboard.tsx:417)
  2. Load Fraunces font. Add import { Fraunces } from 'next/font/google' in the layout or _app. Apply to h2 headings via className. This single change delivers the editorial character the spec describes.
  3. Activity Stream "Show all" toggle. Add const [showAllActivity, setShowAllActivity] = useState(false) and slice data.activities.slice(0, showAllActivity ? undefined : 10). Add a "Show all" button
  below the list. (BriefDashboard.tsx:512)

  ---
  V2 - The Cockpit

  What works: 4-panel grid with drag-resize, status bar, amber accent, sparklines, keyboard shortcuts overlay, command palette. This is the most complete implementation.

  Ive:

  The ambient clock in the header renders once and freezes. A cockpit with a stopped clock is wrong. It communicates the wrong thing - that this is a static render, not a live control room. The
  Notifications panel contains three hardcoded strings with no connection to real data. That's a prop-plane instrument that's just painted on.

  Musk:

  j/k keyboard navigation moves a cursor index but Enter never expands the selected item. The spec says "Enter to expand, Escape to collapse." The cursor goes nowhere. You can see what's selected but
  can't act on it from the keyboard. Half the keyboard-first promise is missing. Also: JetBrains Mono was specified for data/numbers but isn't loaded - the density of a terminal-style font is exactly what
   makes the cockpit read like a cockpit vs. a regular app.

  Actions

  1. Fix the clock. Add a useEffect that setIntervals every 30s to update a time state. Replace the new Date() inline call with time. 4 lines. (CockpitDashboard.tsx:197)
  2. Connect Notifications to real data. Replace the three hardcoded strings with computed values: blocked task count from activeTasks, unread count from data.articles, and velocity comparison from
  getGlobalSparkline. (CockpitDashboard.tsx:415-420)
  3. Implement Enter-to-expand in Focus List. When focusedPanel === 1 and leftTab === 'focus', add a keydown listener: Enter expands the task at cursorIndex (show description + status buttons inline),
  Escape collapses. This is the core j/k payoff. (CockpitDashboard.tsx:127-164)
  4. Load JetBrains Mono. Apply to numeric values, status bar, timestamps. The density reads completely different.

  ---
  V3 - The Studio

  What works: Mode switching, watermark background, three temperature shifts, smart mode suggestion, focus timer, weekly report card, contextual reading. The concept is cleanly executed.

  Ive:

  The mode transition is specified as a 300ms slide left/right animation. The code uses animate-[fadeIn_280ms_ease-out] with key={mode}. The fadeIn keyframe is never defined in the Tailwind config. The
  animation doesn't run. Mode switching is an instant cut. The entire sensory promise - "like walking between rooms" - is absent. The Reading queue strip toggle is buried inside the Ideas Board panel with
   low-contrast text. It reads like a settings option, not a navigation control.

  Musk:

  No keyboard shortcuts to switch modes. The dock at the bottom works but typing P/E/R to jump between Plan/Execute/Review would match the spec's "keyboard-first" philosophy and is a one-minute add.

  Actions

  1. Fix the mode transition animation - this is critical. Either add @keyframes fadeIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } } to
  tailwind.config.ts under theme.extend.keyframes, OR install framer-motion and wrap each mode screen in <AnimatePresence> with slide variants. The spec allocated these transitions significant creative
  weight. (StudioDashboard.tsx:156)
  2. Add keyboard mode switching. In the existing keydown handler, add: if (event.key.toLowerCase() === 'p') setMode('plan'), if (event.key.toLowerCase() === 'e') setMode('execute'), if
  (event.key.toLowerCase() === 'r') setMode('review'). Update the shortcut overlay to show these. (StudioDashboard.tsx)
  3. Load Instrument Serif and Berkeley Mono. Apply Instrument Serif to the 22vw watermark and the section headings. Berkeley Mono to timer and metric numbers. The temperature-based palette is thoughtful
  but the fonts are what make the three modes feel like distinct environments.

  ---
  V4 - The Map

  What works: SVG canvas with pan/drag, minimap with click-to-jump, hover-to-dim unlinked nodes, blocking edges in red, heat indicators (overdue/stale/recent), double-click to create tasks, filter
  toggles.

  Ive:

  The zoom transition is instantaneous. The spec explicitly calls for smooth 200ms easing. Right now zooming with the scroll wheel is a jump. The node detail overlay (sidebar panel on click) breaks the
  spatial metaphor - selecting a node should feel like the map responding, not a web panel appearing. The sidebar fights with the canvas character.

  The three zoom level paradigm - the spec's central invention - is entirely missing. Zoomed out: see projects as large circles. Zoomed mid: see a project's tasks as a spatial cluster. Zoomed in: see a
  single task card in full detail. What was built is just one mode with continuous zoom. The density barely changes. You never arrive at a single task. The concept never lands.

  Musk:

  Ideas are assigned to project clusters by modulo of array index, not by any data relationship. data.ideas[index % data.projects.length]. That's an accident of iteration, not a data model. An idea about
  "TrueDose pricing" is floating near "Co-Working Dashboard" because it happens to be at index 2. This undermines the entire "see dependencies" premise.

  d3-force was specified for layout. What was built is a static circular arrangement. The promise was that "related projects cluster together." Static circles don't cluster - they're just evenly
  distributed on a ring. The force-directed layout is the mechanism that makes the map meaningful.

  Actions

  1. Implement the three zoom levels. Define zoom thresholds: < 0.6 = portfolio view (only project circles, large labels), 0.6-1.2 = cluster view (project + surrounding tasks visible), > 1.2 = task focus
  view (selected task expands to a full detail card, other nodes fade). Replace the current sidebar overlay with inline zoom-to-task behavior. This is the core UX invention. (MapDashboard.tsx)
  2. Fix idea-to-project mapping. Add a project_id field to ideas in the data model, OR map ideas to projects by matching category names to project names. At minimum: ideas should only cluster near a
  project if there's an explicit relationship, else float in the center of the canvas as unattached nodes.
  3. Add smooth zoom easing. Instead of setting zoom directly on wheel events, animate toward a target zoom with requestAnimationFrame interpolation. 15 lines of code. (MapDashboard.tsx:263-266)
  4. Install d3-force for layout (lower priority than above, but important for the clustering promise). Replace the static circular positioning with a force simulation. Project nodes repel each other,
  task nodes are attracted to their parent project. This makes the map a data visualization, not just a spatial diagram.

  ---
  V5 - The Pulse

  What works: Card stack with correct color palette per card type, momentum score, progress dots on right edge, pull-up drawer, keyboard navigation, swipe gesture, digest export, adaptive card ordering.
  Closest to spec of all variants.

  Ive:

  Card transitions don't animate. The spec calls for vertical slide + fade (300ms) between cards. The code uses transition-all duration-300 on the <article> element but swaps current by changing state -
  there's no keyframe, no AnimatePresence, no animation in or out. When you press down, the card changes instantly. This is the highest-traffic interaction in the entire variant and it has no motion.

  The card at key={current.id} re-mounts on each navigation. Without Framer Motion's AnimatePresence, the exiting card disappears immediately and the entering card appears instantly. No overlap, no slide.
   The spec's "magazine" character comes entirely from these transitions.

  Newsreader font not loaded. Task titles at 48px are correct, but in Inter not Newsreader. The serif font is what makes each card feel like a feature story, not a SaaS form.

  Musk:

  Swipe left is mapped to dismissCurrent(false) - which calls setDismissed(...) and advances. The spec says swipe left = "snooze/skip" meaning the item should remain accessible, while swipe right =
  "done." The implementation treats both swipe directions as dismiss, just with different markDone values. Snooze should re-queue the card at the end of the stack, not permanently dismiss it.

  Actions

  1. Install Framer Motion and implement AnimatePresence for card transitions. Wrap the card in <AnimatePresence mode="wait">. Define enter variants (y: 80, opacity: 0 → y: 0, opacity: 1) and exit
  variants (y: -80, opacity: 0). Apply 300ms ease-out. This single change delivers the entire "editorial feed" character. (PulseDashboard.tsx:222)
  2. Implement snooze correctly. When dismissCurrent(false) is called (swipe left / ArrowLeft), instead of marking dismissed, move the card to the end of the stack: setFeedCards(prev => [...prev.filter(c
  => c.id !== current.id), current]). The card reappears at the end. (PulseDashboard.tsx:126-135)
  3. Load Newsreader font. Apply to all h1 card titles. This is the single highest-impact visual change per character of code written.
  4. Move "Share your Pulse" to the done card, not the activity card. The spec is explicit: share on the summary/caught-up card. (PulseDashboard.tsx:370)

  ---
  Priority Stack (Across All Variants)

  ┌──────────┬───────────────────────────────────────────────────────────────┬──────────┬────────────────────────────────┐
  │ Priority │                            Action                             │ Variant  │             Impact             │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 1        │ Framer Motion card transitions                                │ V5       │ Core experience                │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 2        │ Three zoom levels                                             │ V4       │ Core concept is absent         │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 3        │ Mode transition animation (fix keyframe or add framer-motion) │ V3       │ Feature spec, currently broken │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 4        │ Ideas horizontal swimlane                                     │ V1       │ Visual identity                │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 5        │ Enter-to-expand keyboard                                      │ V2       │ Key feature missing            │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 6        │ Font loading (Fraunces, Newsreader, Instrument Serif)         │ V1/V3/V5 │ Cross-variant craft            │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 7        │ Fix live clock                                                │ V2       │ Embarrassing detail            │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 8        │ d3-force layout                                               │ V4       │ Clustering promise             │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 9        │ Snooze vs. dismiss                                            │ V5       │ Behavior correctness           │
  ├──────────┼───────────────────────────────────────────────────────────────┼──────────┼────────────────────────────────┤
  │ 10       │ Idea-to-project mapping                                       │ V4       │ Data integrity                 │
  └──────────┴───────────────────────────────────────────────────────────────┴──────────┴────────────────────────────────┘

  Items 1-3 are the most broken against spec. Items 4-6 are craft gaps. Items 7-10 are polish. Do them in that order.
